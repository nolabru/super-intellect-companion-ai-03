
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { logError } from "./utils/logging.ts";

// Import model services
import * as lumaService from "./services/models/luma.ts";
import * as mockService from "./services/models/mock.ts";
import * as openaiService from "./services/models/openai.ts";
import * as anthropicService from "./services/models/anthropic.ts";

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
}

// Main handler for all AI chat requests
async function handleAIChat(req: Request): Promise<Response> {
  try {
    const { content, mode, modelId, files, params } = await req.json();
    console.log(`Recebida solicitação para modelo ${modelId} no modo ${mode}`, {
      contentLength: content?.length,
      filesCount: files?.length,
      paramsPreview: params ? JSON.stringify(params).substring(0, 100) : 'none'
    });
    
    let response: ResponseData = {
      content: "Não foi possível processar sua solicitação."
    };
    
    // Process based on model and mode
    try {
      // Verificação específica para modelos Luma
      if (modelId.includes("luma")) {
        // Obter a API KEY da Luma
        const apiKey = Deno.env.get("LUMA_API_KEY");
        console.log("Verificando variáveis de ambiente disponíveis:");
        console.log("Variáveis disponíveis:", Object.keys(Deno.env.toObject()).join(", "));
        
        // Log para debug
        console.log("LUMA_API_KEY está definida?", apiKey ? "Sim" : "Não");
        if (apiKey) {
          console.log("Formato da chave:", 
                     apiKey.startsWith("luma_") ? "Correto (começa com luma_)" : 
                     apiKey.startsWith("luma-") ? "Alternativo (começa com luma-)" : 
                     "Incorreto (formato não reconhecido)");
          console.log("Comprimento da chave:", apiKey.length);
        }
        
        // Verificar se a chave existe
        if (!apiKey || apiKey.trim() === '') {
          console.error("LUMA_API_KEY não configurada ou vazia");
          return new Response(
            JSON.stringify({
              content: "Chave API da Luma não configurada no servidor. Por favor, configure a chave LUMA_API_KEY nas variáveis de ambiente.",
              error: "LUMA_API_KEY não configurada",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        
        // Testar a validade da chave API
        console.log("Testando validade da chave API Luma...");
        try {
          const isValid = await lumaService.testApiKey(apiKey);
          if (!isValid) {
            console.error("Chave API Luma inválida");
            return new Response(
              JSON.stringify({
                content: "A chave API da Luma é inválida ou expirou. Por favor, verifique a chave LUMA_API_KEY nas variáveis de ambiente.",
                error: "LUMA_API_KEY inválida",
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
              }
            );
          }
          console.log("Chave API Luma válida, prosseguindo com a solicitação");
        } catch (keyError) {
          console.error("Erro ao validar chave API Luma:", keyError);
          return new Response(
            JSON.stringify({
              content: `Erro ao validar a chave API da Luma: ${keyError.message}`,
              error: "Erro na validação da chave API",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
      
      // Special check for OpenAI models
      if (modelId.includes("gpt")) {
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
              status: 400,
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
              status: 400,
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
        
        response = await lumaService.generateVideo(content, videoParams, imageUrl);
        console.log("Processamento de vídeo concluído com sucesso");
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
      }
      
      // OpenAI models
      else if (modelId.includes("gpt") && mode === "text") {
        console.log("Iniciando processamento de texto com OpenAI");
        response = await openaiService.generateText(content, modelId);
        console.log("Processamento de texto concluído com sucesso");
      }
      else if (modelId.includes("gpt") && mode === "image") {
        console.log("Iniciando processamento de imagem com OpenAI");
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        if (imageUrl) {
          response = await openaiService.processImage(content, imageUrl, modelId);
        } else {
          response = { content: "Erro: Necessário fornecer uma imagem para análise." };
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
      
      // Simulation for other models
      else if (modelId.includes("ideogram") && mode === "image") {
        response = mockService.generateImage(content, "Ideogram");
      } 
      else if (modelId.includes("kligin") && mode === "image") {
        response = mockService.generateImage(content, "Kligin AI");
      }
      else if (modelId.includes("kligin") && mode === "video") {
        response = mockService.generateVideo(content, "Kligin AI");
      }
      else {
        // Default mock response for any other model/mode
        response = mockService.generateText(content, modelId, mode);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError("SERVICE_ERROR", { error: errorMessage, model: modelId, mode });
      
      let friendlyError = `Erro ao processar solicitação: ${errorMessage}`;
      
      // Mensagens de erro específicas
      if (modelId.includes("luma")) {
        if (errorMessage.includes("API key") || errorMessage.includes("Authorization") || errorMessage.includes("authenticate")) {
          friendlyError = "Erro de configuração: A chave API do Luma AI não está configurada corretamente. Por favor, verifique suas configurações.";
        } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
          friendlyError = "Erro na API Luma: Endpoint não encontrado. A API pode ter sido atualizada.";
        } else {
          friendlyError = `Erro na geração do ${mode === 'video' ? 'vídeo' : 'imagem'} com Luma AI: ${errorMessage}`;
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
