
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { logError } from "./utils/logging.ts";
import { generateLumaVideo } from "./services/luma-video.ts";
import { generateLumaImage } from "./services/luma-image.ts";
import { generateMockImage, generateMockVideo, generateMockText } from "./services/mock-services.ts";

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
}

// Test API key validity
async function testLumaApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log("Validando a API key da Luma...");
    
    const testResponse = await fetch("https://api.lumalabs.ai/v2/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    const responseText = await testResponse.text();
    console.log(`Resposta do teste de API key: ${testResponse.status} - ${responseText}`);
    
    if (!testResponse.ok) {
      logError("INVALID_API_KEY", { status: testResponse.status, response: responseText });
      return false;
    }
    
    console.log("API key validada com sucesso!");
    return true;
  } catch (error) {
    logError("API_KEY_TEST_ERROR", { error: error instanceof Error ? error.message : String(error) });
    console.log("Aviso: Erro ao testar API key, mas continuando mesmo assim");
    return false;
  }
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
    
    // Atualizar manualmente a API KEY com a fornecida (se necessário para teste)
    const apiKey = Deno.env.get("LUMA_API_KEY");
    const apiKeyToUse = apiKey || "luma-daf72961-1c29-40ed-9bfb-9b603aefd583-7b4a016e-0207-4ccc-baea-b9c9f6c8fe39";
    
    if (!apiKey) {
      console.log("LUMA_API_KEY não encontrada nas variáveis de ambiente, usando chave fornecida manualmente");
      // Define a variável de ambiente temporariamente
      // @ts-ignore - Deno permite isso mesmo que TypeScript reclame
      Deno.env.set("LUMA_API_KEY", apiKeyToUse);
    }
    
    // Validate API key for Luma models
    if (modelId.includes("luma")) {
      const isValidKey = await testLumaApiKey(apiKeyToUse);
      
      if (!isValidKey) {
        return new Response(
          JSON.stringify({
            content: "Erro: A chave de API do Luma é inválida ou expirou. Por favor, verifique sua chave API.",
            error: "LUMA_API_KEY inválida",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }
    
    // Process based on model and mode
    try {
      if (modelId === "luma-video" && mode === "video") {
        console.log("Iniciando processamento de vídeo com Luma AI");
        // Determine if we have an image for image-to-video
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        response = await generateLumaVideo(content, params, imageUrl);
        console.log("Processamento de vídeo concluído com sucesso");
      } 
      else if (modelId === "luma-image" && mode === "image") {
        console.log("Iniciando processamento de imagem com Luma AI");
        response = await generateLumaImage(content, params);
        console.log("Processamento de imagem concluído com sucesso");
      }
      else if (modelId.includes("ideogram") && mode === "image") {
        response = generateMockImage(content, "Ideogram");
      } 
      else if (modelId.includes("kligin") && mode === "image") {
        response = generateMockImage(content, "Kligin AI");
      }
      else if (modelId.includes("kligin") && mode === "video") {
        response = generateMockVideo(content, "Kligin AI");
      }
      else {
        // Default mock response for any other model/mode
        response = generateMockText(content, modelId, mode);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError("SERVICE_ERROR", { error: errorMessage, model: modelId, mode });
      
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
