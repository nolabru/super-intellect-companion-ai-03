
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

// Token mocado para testes com a Luma API
const MOCKED_LUMA_TOKEN = "luma-909c02af-aaa5-49a1-9f85-313573557330-65a1de78-ca4b-4f7c-b33b-f493bb0dda75";

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
