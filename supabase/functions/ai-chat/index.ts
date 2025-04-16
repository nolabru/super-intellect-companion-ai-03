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

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
}

// Token mocado para testes com a Luma API - usando o token fornecido pelo usuário
const MOCKED_LUMA_TOKEN = "luma-d0412b33-742d-4c23-bea2-cf7a8e2af184-ef7762ab-c1c6-4e73-b6d4-42078e8c7775";

// Main handler for all AI chat requests
async function handleAIChat(req: Request): Promise<Response> {
  try {
    const { content, mode, modelId, files, params, userId } = await req.json();
    console.log(`Recebida solicitação para modelo ${modelId} no modo ${mode}`, {
      contentLength: content?.length,
      filesCount: files?.length,
      paramsPreview: params ? JSON.stringify(params).substring(0, 100) : 'none',
      userIdProvided: !!userId
    });
    
    // Extract memory context if this is a memory-enhanced request
    let enhancedContent = content;
    
    // Check if content has memory context prepended
    if (content.includes("User information from previous conversations:") && 
        content.includes("\n\n")) {
      console.log("Detected memory-enhanced content");
      
      // Just for logging
      const memoryLines = content.split("\n\n")[0].split("\n").length - 1;
      console.log(`Memory context contains ${memoryLines} items`);
    }
    
    // First check if user has enough tokens for this operation
    let tokensUsed = 0;
    let tokensRemaining = 0;
    
    if (userId) {
      try {
        const tokenCheck = await checkUserTokens(userId, modelId, mode);
        
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
        console.log(`Token check passed for user ${userId}. Required: ${tokensUsed}, Remaining: ${tokenCheck.tokensRemaining}`);
      } catch (error) {
        // Log error but allow operation to proceed
        console.warn(`Erro ao verificar tokens para usuário ${userId}, prosseguindo sem verificação:`, error);
      }
    } else {
      console.log(`No user ID provided, proceeding without token check`);
    }
    
    let response: ResponseData = {
      content: "Não foi possível processar sua solicitação."
    };
    
    // Process based on model and mode
    try {
      // Verificação específica para modelos Luma
      if (modelId.includes("luma")) {
        // Usando token mocado para Luma
        console.log("Modelo Luma selecionado, usando token mocado configurado diretamente no código");
        // Pré-configuramos a variável LUMA_TOKEN_MOCK no service
        lumaService.setMockedToken(MOCKED_LUMA_TOKEN);
        
        // Validação opcional para ver se o token funciona
        const isValid = await lumaService.testApiKey(MOCKED_LUMA_TOKEN);
        if (!isValid) {
          console.warn("O token mocado da Luma pode não estar funcionando corretamente");
        }
      }
      
      // Special check for OpenAI models
      if (modelId.includes("gpt") || modelId.includes("dall-e")) {
        try {
          // Verify OpenAI API key before proceeding
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
      }
      
      // Special check for Anthropic models
      if (modelId.includes("claude")) {
        try {
          // Verify Anthropic API key before proceeding
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
      }
      
      // Verificação para ElevenLabs
      if (modelId.includes("eleven") || modelId.includes("elevenlabs-tts")) {
        try {
          // Verificar a chave API do ElevenLabs antes de prosseguir
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
      }
      
      // Verificação para Google Gemini
      if (modelId.includes("gemini")) {
        try {
          // Verificar a chave API do Gemini antes de prosseguir
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
      }
      
      // Verificação para Deepseek
      if (modelId.includes("deepseek")) {
        try {
          console.log("Verificando DEEPSEEK_API_KEY...");
          // Verificar a chave API do Deepseek antes de prosseguir
          deepseekService.verifyApiKey();
        } catch (error) {
          console.error("Erro na verificação do DEEPSEEK_API_KEY:", error);
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
      }
      
      // Luma AI models
      if (modelId === "luma-video" && mode === "video") {
        console.log("Iniciando processamento de vídeo com Luma AI");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        
        // Se não houver parâmetros definidos, use valores padrão para o modelo Luma
        const videoParams = {
          ...params,
          model: params?.model || "ray-2"
        };
        
        // Usar AbortController para limitar o tempo total da operação
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Atingido tempo máximo global para processamento de vídeo (5 minutos)");
          controller.abort();
        }, 300000); // 5 minutos
        
        try {
          response = await Promise.race([
            lumaService.generateVideo(content, videoParams, imageUrl),
            new Promise<ResponseData>((_, reject) => {
              // Se o AbortController for acionado, este Promise rejeitará
              controller.signal.addEventListener('abort', () => {
                reject(new Error("Tempo limite global excedido para processamento de vídeo (5 minutos)"));
              });
            })
          ]);
          clearTimeout(timeoutId);
          console.log("Processamento de vídeo concluído com sucesso");
          
          // Adicionar timestamp à URL do vídeo para evitar cache
          if (response.files && response.files.length > 0) {
            response.files[0] = addTimestampToUrl(response.files[0]);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } 
      else if (modelId === "luma-image" && mode === "image") {
        console.log("Iniciando processamento de imagem com Luma AI");
        
        // Se não houver parâmetros definidos, use valores padrão para o modelo Luma
        const imageParams = {
          ...params,
          model: params?.model || "luma-1.1"
        };
        
        response = await lumaService.generateImage(content, imageParams);
        console.log("Processamento de imagem concluído com sucesso");
        
        // Adicionar timestamp à URL da imagem para evitar cache
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      
      // OpenAI models
      else if (modelId.includes("gpt") && mode === "text") {
        console.log("Iniciando processamento de texto com OpenAI");
        
        try {
          // Verify OpenAI API key exists
          const apiKey = openaiService.verifyApiKey();
          console.log("Chave API do OpenAI verificada com sucesso");
          
          // Log a amostra mascarada da chave para debugging (apenas os primeiros e últimos 4 caracteres)
          if (apiKey.length > 8) {
            const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
            console.log(`Usando chave API do OpenAI: ${maskedKey}`);
          }
          
          response = await openaiService.generateText(content, modelId);
          console.log("Processamento de texto concluído com sucesso");
        } catch (openaiError) {
          console.error("Erro detalhado ao processar texto com OpenAI:", openaiError);
          throw openaiError;
        }
      }
      else if (modelId.includes("gpt") && mode === "image" && files && files.length > 0) {
        console.log("Iniciando processamento de análise de imagem com OpenAI");
        const imageUrl = files[0];
        response = await openaiService.processImage(content, imageUrl, modelId);
        console.log("Análise de imagem concluída com sucesso");
      }
      else if ((modelId.includes("gpt") || modelId === "dall-e-3") && mode === "image" && (!files || files.length === 0)) {
        console.log("Iniciando geração de imagem com DALL-E via OpenAI");
        response = await openaiService.generateImage(content, modelId === "gpt-4o" ? "dall-e-3" : modelId);
        console.log("Geração de imagem concluída com sucesso");
        
        // Adicionar timestamp à URL da imagem para evitar cache
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      
      // Anthropic models
      else if (modelId.includes("claude") && mode === "text") {
        console.log("Iniciando processamento de texto com Anthropic");
        response = await anthropicService.generateText(content, modelId);
        console.log("Processamento de texto concluído com sucesso");
      }
      else if (modelId.includes("claude") && mode === "image") {
        console.log("Iniciando processamento de imagem com Anthropic");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        if (imageUrl) {
          response = await anthropicService.processImage(content, imageUrl, modelId);
        } else {
          response = { content: "Erro: Necessário fornecer uma imagem para análise." };
        }
      }
      
      // Google Gemini models
      else if (modelId.includes("gemini") && mode === "text") {
        console.log("Iniciando processamento de texto com Google Gemini");
        response = await geminiService.generateText(content, modelId);
        console.log("Processamento de texto concluído com sucesso");
      }
      else if (modelId.includes("gemini") && mode === "image" && files && files.length > 0) {
        console.log("Iniciando processamento de análise de imagem com Google Gemini Vision");
        const imageUrl = files[0];
        response = await geminiService.processImage(content, imageUrl, modelId);
        console.log("Análise de imagem concluída com sucesso");
      }
      
      // ElevenLabs models
      else if ((modelId === "eleven-labs" || modelId === "elevenlabs-tts") && mode === "audio") {
        console.log("Iniciando geração de áudio com ElevenLabs");
        // Extraindo parâmetros
        const voiceParams = {
          voiceId: params?.voiceId || "EXAVITQu4vr4xnSDxMaL", // Sarah por padrão
          model: params?.model || "eleven_multilingual_v2",
          stability: params?.stability || 0.5,
          similarityBoost: params?.similarityBoost || 0.75,
          style: params?.style || 0,
          speakerBoost: params?.speakerBoost || true
        };
        
        response = await elevenlabsService.generateSpeech(content, voiceParams);
        console.log("Geração de áudio concluída com sucesso");
        
        // Adicionar timestamp à URL do áudio para evitar cache
        if (response.files && response.files.length > 0) {
          response.files[0] = addTimestampToUrl(response.files[0]);
        }
      }
      else if ((modelId === 'deepseek-chat' || modelId === 'deepseek-coder') && mode === 'text') {
        console.log("Iniciando processamento de texto com Deepseek");
        response = await deepseekService.generateText(content, modelId);
        console.log("Processamento de texto concluído com sucesso");
      }
      else {
        return new Response(
          JSON.stringify({
            content: `Combinação de modelo e modo não suportada: ${modelId} / ${mode}`,
            error: "Combinação não suportada",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      // Log dos resultados
      console.log(`Resposta do modelo ${modelId} no modo ${mode} gerada com sucesso:`, {
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
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Erro detalhado no processamento:", error);
      logError("SERVICE_ERROR", { error: errorMessage, model: modelId, mode });
      
      let friendlyError = `Erro ao processar solicitação: ${errorMessage}`;
      
      // Mensagens de erro específicas baseadas no erro original
      if (modelId.includes("gpt") || modelId === "dall-e-3") {
        if (errorMessage.includes("API key") || errorMessage.includes("authorize") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do OpenAI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("billing") || errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          friendlyError = "Erro de limite: Você excedeu seu limite de uso da OpenAI. Verifique seu plano e faturamento.";
        } else {
          friendlyError = `Erro na geração de ${mode === 'image' ? 'imagem' : 'texto'} com OpenAI: ${errorMessage}`;
        }
      } else if (modelId.includes("luma")) {
        if (errorMessage.includes("API key") || errorMessage.includes("Authorization") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Luma AI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          friendlyError = "Erro na API Luma: Endpoint não encontrado. A API pode ter sido atualizada.";
        } else if (errorMessage.includes("Tempo limite")) {
          friendlyError = `O processamento do ${mode === 'video' ? 'vídeo' : 'imagem'} excedeu o tempo limite. A geração pode estar em andamento no servidor do Luma AI, verifique seu painel de controle.`;
        } else {
          friendlyError = `Erro na geração do ${mode === 'video' ? 'vídeo' : 'imagem'} com Luma AI: ${errorMessage}`;
        }
      } else if (modelId.includes("eleven")) {
        if (errorMessage.includes("API key") || errorMessage.includes("xi-api-key") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do ElevenLabs não está configurada corretamente. Por favor, verifique suas configurações.";
        } else {
          friendlyError = `Erro na geração de áudio com ElevenLabs: ${errorMessage}`;
        }
      } else if (modelId.includes("gemini")) {
        if (errorMessage.includes("API key") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Google Gemini não está configurada corretamente. Por favor, verifique suas configurações.";
        } else {
          friendlyError = `Erro na geração com Google Gemini: ${errorMessage}`;
        }
      } else if (modelId.includes("deepseek")) {
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
    console.error("Erro ao processar solicitação:", error);
    
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
