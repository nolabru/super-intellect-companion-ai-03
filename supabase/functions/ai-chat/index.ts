
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { logError } from "./utils/logging.ts";
import { checkUserTokens } from "./utils/tokenManager.ts";

// Import model services
import * as lumaService from "./services/models/luma.ts";
import * as openaiService from "./services/models/openai.ts";
import * as anthropicService from "./services/models/anthropic.ts";
import * as elevenlabsService from "./services/models/elevenlabs.ts";
import * as geminiService from "./services/models/gemini.ts";
import * as deepseekService from "./services/models/deepseek.ts";
import * as kliginService from "./services/models/kligin.ts";

// Import orchestrator service
import * as orchestratorService from "./services/orchestrator.ts";

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
  modeSwitch?: {
    newMode: string;
    newModel: string;
  };
}

// Token mocado para testes com a Luma API - usando o token fornecido pelo usuário
const MOCKED_LUMA_TOKEN = "luma-d0412b33-742d-4c23-bea2-cf7a8e2af184-ef7762ab-c1c6-4e73-b6d4-42078e8c7775";
// Token mocado para testes com a Kligin API
const MOCKED_KLIGIN_TOKEN = Deno.env.get("KLIGIN_API_KEY") || "";

// Main handler for all AI chat requests
async function handleAIChat(req: Request): Promise<Response> {
  try {
    // Extrair dados da requisição
    const { 
      content, 
      mode, 
      modelId, 
      files, 
      params, 
      userId, 
      conversationId,
      conversationHistory 
    } = await req.json();
    
    console.log(`[AI-Chat] Recebida solicitação para modelo ${modelId} no modo ${mode}`, {
      contentLength: content?.length,
      filesCount: files?.length,
      paramsPreview: params ? JSON.stringify(params).substring(0, 100) : 'none',
      userIdProvided: !!userId,
      conversationIdProvided: !!conversationId
    });
    
    // Variáveis que podem ser alteradas pelo orquestrador
    let processedContent = content;
    let processedMode = mode;
    let processedModelId = modelId;
    let modeSwitchDetected = false;
    
    // Aplicar orquestrador se userId estiver presente e não for solicitação de mídia direta
    if (userId && mode === "text") {
      try {
        console.log(`[AI-Chat] Iniciando orquestrador para analisar a mensagem`);
        
        // Processar a mensagem com o orquestrador
        const orchestratorResult = await orchestratorService.processUserMessage(
          content,
          userId,
          mode,
          modelId,
          conversationHistory
        );
        
        // Verificar se o orquestrador sugeriu troca de modo
        if (orchestratorResult.detectedMode !== mode) {
          console.log(`[AI-Chat] Orquestrador detectou troca de modo: ${mode} -> ${orchestratorResult.detectedMode}`);
          processedMode = orchestratorResult.detectedMode;
          modeSwitchDetected = true;
        }
        
        // Verificar se o orquestrador sugeriu trocar o modelo
        if (orchestratorResult.recommendedModel !== modelId) {
          console.log(`[AI-Chat] Orquestrador recomendou troca de modelo: ${modelId} -> ${orchestratorResult.recommendedModel}`);
          processedModelId = orchestratorResult.recommendedModel;
        }
        
        // Usar prompt melhorado do orquestrador
        processedContent = orchestratorResult.enhancedPrompt;
        console.log(`[AI-Chat] Prompt melhorado pelo orquestrador: "${processedContent.substring(0, 50)}..."`);
        
        // Se existirem itens de memória extraídos, salvá-los
        if (orchestratorResult.memoryExtracted && orchestratorResult.memoryItems) {
          // Aqui seria o código para salvar os itens de memória
          console.log(`[AI-Chat] Itens de memória extraídos pelo orquestrador`);
        }
        
        // Enriquecer o prompt com contexto de memória (se disponível)
        if (userId) {
          const memoryContext = await orchestratorService.getUserMemoryContext(userId);
          if (memoryContext) {
            processedContent = orchestratorService.enrichPromptWithMemory(processedContent, memoryContext);
            console.log(`[AI-Chat] Prompt enriquecido com contexto de memória`);
          }
        }
        
      } catch (orchestratorError) {
        console.error(`[AI-Chat] Erro no orquestrador, continuando com dados originais:`, orchestratorError);
        // Em caso de erro, continuamos com o prompt original
      }
    }
    
    // First check if user has enough tokens for this operation
    let tokensUsed = 0;
    let tokensRemaining = 0;
    
    if (userId) {
      try {
        // Usar o modo e modelo processados pelo orquestrador
        const tokenCheck = await checkUserTokens(userId, processedModelId, processedMode);
        
        if (!tokenCheck.hasEnoughTokens) {
          console.log(`User ${userId} does not have enough tokens for this operation: ${tokenCheck.tokensRequired} required, ${tokenCheck.tokensRemaining} remaining`);
          return new Response(
            JSON.stringify({
              content: tokenCheck.error || "Não há tokens suficientes para essa operação",
              tokenInfo: {
                tokensRequired: tokenCheck.tokensRequired,
                tokensRemaining: tokenCheck.tokensRemaining || 0
              },
              error: "INSUFFICIENT_TOKENS"
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 402 // Payment Required
            }
          );
        }
        
        tokensUsed = tokenCheck.tokensRequired || 0;
        tokensRemaining = tokenCheck.tokensRemaining || 0;
        console.log(`[AI-Chat] Token check passed for user ${userId}. Required: ${tokensUsed}, Remaining: ${tokenCheck.tokensRemaining}`);
      } catch (error) {
        // Log error but allow operation to proceed
        console.warn(`[AI-Chat] Erro ao verificar tokens para usuário ${userId}, prosseguindo sem verificação:`, error);
      }
    } else {
      console.log(`[AI-Chat] No user ID provided, proceeding without token check`);
    }
    
    let response: ResponseData = {
      content: "Não foi possível processar sua solicitação."
    };
    
    // Process based on model and mode
    try {
      // Verificação específica para modelos Luma
      if (processedModelId.includes("luma")) {
        // Usando token mocado para Luma
        console.log("[AI-Chat] Modelo Luma selecionado, usando token mocado configurado diretamente no código");
        // Pré-configuramos a variável LUMA_TOKEN_MOCK no service
        lumaService.setMockedToken(MOCKED_LUMA_TOKEN);
        
        // Validação opcional para ver se o token funciona
        const isValid = await lumaService.testApiKey(MOCKED_LUMA_TOKEN);
        if (!isValid) {
          console.warn("[AI-Chat] O token mocado da Luma pode não estar funcionando corretamente");
        }
      } else if (processedModelId.includes("kligin")) {
        // Usando token configurado para Kligin
        console.log("[AI-Chat] Modelo Kligin selecionado, verificando configuração do token");
        
        if (MOCKED_KLIGIN_TOKEN) {
          kliginService.setMockedToken(MOCKED_KLIGIN_TOKEN);
          console.log("[AI-Chat] Token Kligin configurado com sucesso");
          
          // Validação opcional para ver se o token funciona
          try {
            const isValid = await kliginService.testApiKey(MOCKED_KLIGIN_TOKEN);
            if (!isValid) {
              console.warn("[AI-Chat] O token do Kligin pode não estar funcionando corretamente");
            }
          } catch (error) {
            console.error("[AI-Chat] Erro ao testar token do Kligin:", error);
          }
        } else {
          console.warn("[AI-Chat] KLIGIN_API_KEY não configurada, verificando em verifyApiKey");
        }
      }
      
      // Validações para diversos modelos
      if (processedModelId.includes("gpt") || processedModelId.includes("dall-e")) {
        try {
          openaiService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "OPENAI_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      } else if (processedModelId.includes("claude")) {
        try {
          anthropicService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "ANTHROPIC_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      } else if (processedModelId.includes("eleven") || processedModelId.includes("elevenlabs-tts")) {
        try {
          elevenlabsService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "ELEVENLABS_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      } else if (processedModelId.includes("gemini")) {
        try {
          geminiService.verifyApiKey();
        } catch (error) {
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "GEMINI_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      } else if (processedModelId.includes("deepseek")) {
        try {
          deepseekService.verifyApiKey();
        } catch (error) {
          console.error("[AI-Chat] Erro na verificação do DEEPSEEK_API_KEY:", error);
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "DEEPSEEK_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      } else if (processedModelId.includes("kligin")) {
        try {
          kliginService.verifyApiKey();
        } catch (error) {
          console.error("[AI-Chat] Erro na verificação do KLIGIN_API_KEY:", error);
          return new Response(
            JSON.stringify({
              content: error.message,
              error: "KLIGIN_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            }
          );
        }
      }
      
      // Processar solicitação com base no modo e modelo processados pelo orquestrador
      // Luma AI models
      if (processedModelId === "luma-video" && processedMode === "video") {
        console.log("[AI-Chat] Iniciando processamento de vídeo com Luma AI");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        
        const videoParams = {
          ...params,
          model: params?.model || "ray-2"
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("[AI-Chat] Atingido tempo máximo global para processamento de vídeo (5 minutos)");
          controller.abort();
        }, 300000); // 5 minutos
        
        try {
          response = await Promise.race([
            lumaService.generateVideo(processedContent, videoParams, imageUrl),
            new Promise<ResponseData>((_, reject) => {
              controller.signal.addEventListener('abort', () => {
                reject(new Error("Tempo limite global excedido para processamento de vídeo (5 minutos)"));
              });
            })
          ]);
          clearTimeout(timeoutId);
          console.log("[AI-Chat] Processamento de vídeo concluído com sucesso");
          
          if (response.files && response.files.length > 0) {
            response.files[0] = addTimestampToUrl(response.files[0]);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } 
      else if (processedModelId === "luma-image" && processedMode === "image") {
        console.log("[AI-Chat] Iniciando processamento de imagem com Luma AI");
        
        const imageParams = {
          ...params,
          model: params?.model || "luma-1.1"
        };
        
        response = await lumaService.generateImage(processedContent, imageParams);
        console.log("[AI-Chat] Processamento de imagem concluído com sucesso");
        
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      // Kligin models
      else if (processedModelId === "kligin-video" && processedMode === "video") {
        console.log("[AI-Chat] Iniciando processamento de vídeo com Kligin AI");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        
        const videoParams = {
          ...params,
          model: params?.model || "kling-v1"
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("[AI-Chat] Atingido tempo máximo global para processamento de vídeo (5 minutos)");
          controller.abort();
        }, 300000); // 5 minutos
        
        try {
          response = await Promise.race([
            kliginService.generateVideo(processedContent, videoParams, imageUrl),
            new Promise<ResponseData>((_, reject) => {
              controller.signal.addEventListener('abort', () => {
                reject(new Error("Tempo limite global excedido para processamento de vídeo (5 minutos)"));
              });
            })
          ]);
          clearTimeout(timeoutId);
          console.log("[AI-Chat] Processamento de vídeo Kligin concluído com sucesso");
          
          if (response.files && response.files.length > 0) {
            response.files[0] = addTimestampToUrl(response.files[0]);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
      else if (processedModelId === "kligin-image" && processedMode === "image") {
        console.log("[AI-Chat] Iniciando processamento de imagem com Kligin AI");
        
        const imageParams = {
          ...params,
          model: params?.model || "kling-v1"
        };
        
        response = await kliginService.generateImage(processedContent, imageParams);
        console.log("[AI-Chat] Processamento de imagem Kligin concluído com sucesso");
        
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      // OpenAI models 
      else if (processedModelId.includes("gpt") && processedMode === "text") {
        console.log("[AI-Chat] Iniciando processamento de texto com OpenAI");
        
        try {
          const apiKey = openaiService.verifyApiKey();
          console.log("[AI-Chat] Chave API do OpenAI verificada com sucesso");
          
          if (apiKey.length > 8) {
            const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
            console.log(`[AI-Chat] Usando chave API do OpenAI: ${maskedKey}`);
          }
          
          response = await openaiService.generateText(processedContent, processedModelId);
          console.log("[AI-Chat] Processamento de texto concluído com sucesso");
        } catch (openaiError) {
          console.error("[AI-Chat] Erro detalhado ao processar texto com OpenAI:", openaiError);
          throw openaiError;
        }
      }
      else if (processedModelId.includes("gpt") && processedMode === "image" && files && files.length > 0) {
        console.log("[AI-Chat] Iniciando processamento de análise de imagem com OpenAI");
        const imageUrl = files[0];
        response = await openaiService.processImage(processedContent, imageUrl, processedModelId);
        console.log("[AI-Chat] Análise de imagem concluída com sucesso");
      }
      else if ((processedModelId.includes("gpt") || processedModelId === "dall-e-3") && processedMode === "image" && (!files || files.length === 0)) {
        console.log("[AI-Chat] Iniciando geração de imagem com DALL-E via OpenAI");
        response = await openaiService.generateImage(processedContent, processedModelId === "gpt-4o" ? "dall-e-3" : processedModelId);
        console.log("[AI-Chat] Geração de imagem concluída com sucesso");
        
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      // Outros modelos
      else if (processedModelId.includes("claude") && processedMode === "text") {
        console.log("[AI-Chat] Iniciando processamento de texto com Anthropic");
        response = await anthropicService.generateText(processedContent, processedModelId);
        console.log("[AI-Chat] Processamento de texto concluído com sucesso");
      }
      else if (processedModelId.includes("claude") && processedMode === "image") {
        console.log("[AI-Chat] Iniciando processamento de imagem com Anthropic");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        if (imageUrl) {
          response = await anthropicService.processImage(processedContent, imageUrl, processedModelId);
        } else {
          response = { content: "Erro: Necessário fornecer uma imagem para análise." };
        }
      }
      else if (processedModelId.includes("gemini") && processedMode === "text") {
        console.log("[AI-Chat] Iniciando processamento de texto com Google Gemini");
        response = await geminiService.generateText(processedContent, processedModelId);
        console.log("[AI-Chat] Processamento de texto concluído com sucesso");
      }
      else if (processedModelId.includes("gemini") && processedMode === "image" && files && files.length > 0) {
        console.log("[AI-Chat] Iniciando processamento de análise de imagem com Google Gemini Vision");
        const imageUrl = files[0];
        response = await geminiService.processImage(processedContent, imageUrl, processedModelId);
        console.log("[AI-Chat] Análise de imagem concluída com sucesso");
      }
      else if ((processedModelId === "eleven-labs" || processedModelId === "elevenlabs-tts") && processedMode === "audio") {
        console.log("[AI-Chat] Iniciando geração de áudio com ElevenLabs");
        const voiceParams = {
          voiceId: params?.voiceId || "EXAVITQu4vr4xnSDxMaL", // Sarah por padrão
          model: params?.model || "eleven_multilingual_v2",
          stability: params?.stability || 0.5,
          similarityBoost: params?.similarityBoost || 0.75,
          style: params?.style || 0,
          speakerBoost: params?.speakerBoost || true
        };
        
        response = await elevenlabsService.generateSpeech(processedContent, voiceParams);
        console.log("[AI-Chat] Geração de áudio concluída com sucesso");
        
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      else if ((processedModelId === 'deepseek-chat' || processedModelId === 'deepseek-coder') && processedMode === 'text') {
        console.log("[AI-Chat] Iniciando processamento de texto com Deepseek");
        response = await deepseekService.generateText(processedContent, processedModelId);
        console.log("[AI-Chat] Processamento de texto concluído com sucesso");
      }
      else {
        return new Response(
          JSON.stringify({
            content: `Combinação de modelo e modo não suportada: ${processedModelId} / ${processedMode}`,
            error: "Combinação não suportada",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      console.log(`[AI-Chat] Resposta do modelo ${processedModelId} no modo ${processedMode} gerada com sucesso:`, {
        hasFiles: response.files && response.files.length > 0,
        fileCount: response.files?.length || 0,
        contentLength: response.content?.length || 0
      });
      
      // If user ID was provided, add token info to response
      if (userId) {
        response.tokenInfo = {
          tokensUsed: tokensUsed,
          tokensRemaining: tokensRemaining
        };
      }
      
      // Se houver uma troca de modo detectada, adicionar à resposta
      if (modeSwitchDetected) {
        response.modeSwitch = {
          newMode: processedMode,
          newModel: processedModelId
        };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[AI-Chat] Erro detalhado no processamento:", error);
      logError("SERVICE_ERROR", { error: errorMessage, model: processedModelId, mode: processedMode });
      
      let friendlyError = `Erro ao processar solicitação: ${errorMessage}`;
      
      // Mensagens de erro específicas baseadas no erro original
      if (processedModelId.includes("gpt") || processedModelId === "dall-e-3") {
        if (errorMessage.includes("API key") || errorMessage.includes("authorize") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do OpenAI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("billing") || errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          friendlyError = "Erro de limite: Você excedeu seu limite de uso da OpenAI. Verifique seu plano e faturamento.";
        } else {
          friendlyError = `Erro na geração de ${processedMode === 'image' ? 'imagem' : 'texto'} com OpenAI: ${errorMessage}`;
        }
      } else if (processedModelId.includes("luma")) {
        if (errorMessage.includes("API key") || errorMessage.includes("Authorization") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Luma AI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          friendlyError = "Erro na API Luma: Endpoint não encontrado. A API pode ter sido atualizada.";
        } else if (errorMessage.includes("Tempo limite")) {
          friendlyError = `O processamento do ${processedMode === 'video' ? 'vídeo' : 'imagem'} excedeu o tempo limite. A geração pode estar em andamento no servidor do Luma AI, verifique seu painel de controle.`;
        } else {
          friendlyError = `Erro na geração do ${processedMode === 'video' ? 'vídeo' : 'imagem'} com Luma AI: ${errorMessage}`;
        }
      } else if (processedModelId.includes("kligin")) {
        if (errorMessage.includes("API key") || errorMessage.includes("Authorization") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Kligin AI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          friendlyError = "Erro na API Kligin: Endpoint não encontrado. A API pode ter sido atualizada.";
        } else if (errorMessage.includes("Tempo limite")) {
          friendlyError = `O processamento do ${processedMode === 'video' ? 'vídeo' : 'imagem'} excedeu o tempo limite. A geração pode estar em andamento no servidor do Kligin AI.`;
        } else {
          friendlyError = `Erro na geração do ${processedMode === 'video' ? 'vídeo' : 'imagem'} com Kligin AI: ${errorMessage}`;
        }
      } else if (processedModelId.includes("eleven")) {
        if (errorMessage.includes("API key") || errorMessage.includes("xi-api-key") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do ElevenLabs não está configurada corretamente. Por favor, verifique suas configurações.";
        } else {
          friendlyError = `Erro na geração de áudio com ElevenLabs: ${errorMessage}`;
        }
      } else if (processedModelId.includes("gemini")) {
        if (errorMessage.includes("API key") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Google Gemini não está configurada corretamente. Por favor, verifique suas configurações.";
        } else {
          friendlyError = `Erro na geração com Google Gemini: ${errorMessage}`;
        }
      } else if (processedModelId.includes("deepseek")) {
        if (errorMessage.includes("API key") || errorMessage.includes("authorize") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Deepseek não está configurada corretamente. Por favor, verifique suas configurações.";
        } else {
          friendlyError = `Erro na geração de texto com Deepseek: ${errorMessage}`;
        }
      }
      
      return new Response(
        JSON.stringify({
          content: friendlyError,
          error: errorMessage,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[AI-Chat] Erro ao processar solicitação:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logError("REQUEST_ERROR", { error: errorMessage });
    
    return new Response(
      JSON.stringify({
        content: `Erro: ${errorMessage}`,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Helper function to add timestamp to URLs for cache busting
function addTimestampToUrl(url: string): string {
  if (!url) return url;
  
  // Don't add timestamp to data URLs
  if (url.startsWith('data:')) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

// Setup the server
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  
  // Handle API request
  return handleAIChat(req);
});
