
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define response type
interface ResponseData {
  content: string;
  files?: string[];
}

// Define a logger function to write to a log file
function logError(errorType: string, details: any) {
  console.error(`AI-CHAT ERROR [${errorType}]:`, JSON.stringify(details, null, 2));
}

// Function to handle requests with retries
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a 429 (Too Many Requests), wait and retry
      if (response.status === 429) {
        console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error("Maximum retries exceeded");
}

// Function to handle Luma AI video generation
async function generateLumaVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
): Promise<ResponseData> {
  console.log("Iniciando geração de vídeo Luma AI com parâmetros:", params);
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  if (!apiKey) {
    const error = "LUMA_API_KEY não está configurada";
    logError("CONFIG_ERROR", { message: error });
    throw new Error(error);
  }
  
  const isImageToVideo = params?.videoType === "image-to-video" && imageUrl;
  
  // Configure base request payload
  const payload: any = {
    prompt: prompt,
    model: params?.model || "ray-2",
  };
  
  // Add resolution and duration if provided
  if (params?.resolution) {
    payload.resolution = params.resolution;
  }
  
  if (params?.duration) {
    payload.duration = params.duration;
  }
  
  // Add keyframes for image-to-video
  if (isImageToVideo && imageUrl) {
    payload.keyframes = {
      frame0: {
        type: "image",
        url: imageUrl,
      }
    };
  }
  
  console.log(`Enviando requisição para Luma AI (${isImageToVideo ? 'Image-to-Video' : 'Text-to-Video'}):`, payload);
  
  try {
    // Create generation
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/dream-machine/v1/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
      3,
      2000
    );
    
    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      const errorDetails = `Erro ao criar geração Luma AI: ${generationResponse.status} ${errorText}`;
      logError("API_ERROR", { 
        status: generationResponse.status, 
        response: errorText,
        requestPayload: payload 
      });
      throw new Error(errorDetails);
    }
    
    const generationData = await generationResponse.json();
    const generationId = generationData.id;
    
    if (!generationId) {
      const error = "Falha ao obter ID de geração Luma AI";
      logError("API_ERROR", { message: error, response: generationData });
      throw new Error(error);
    }
    
    console.log("Geração Luma AI iniciada com ID:", generationId);
    
    // Poll for completion (up to 3 minutes)
    let videoUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10 second intervals
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Verificando status da geração (tentativa ${attempts}/${maxAttempts})...`);
        
        const statusResponse = await fetchWithRetry(
          `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
          },
          3,
          1000
        );
        
        if (!statusResponse.ok) {
          console.error(`Erro ao verificar status: ${statusResponse.status}`);
          // Continue polling despite error
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`Status atual: ${statusData.state}`);
        
        if (statusData.state === "completed") {
          completed = true;
          videoUrl = statusData.assets?.video || null;
          console.log("Geração concluída com sucesso, URL do vídeo:", videoUrl);
        } else if (statusData.state === "failed") {
          const error = `Geração falhou: ${statusData.failure_reason || "Motivo desconhecido"}`;
          logError("GENERATION_ERROR", { id: generationId, reason: statusData.failure_reason });
          throw new Error(error);
        } else {
          // Still processing, wait 10 seconds
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        // Wait and continue
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (!completed) {
      const error = "Tempo limite excedido aguardando a geração do vídeo";
      logError("TIMEOUT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    if (!videoUrl) {
      const error = "URL do vídeo não disponível após conclusão";
      logError("RESULT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    return {
      content: "Vídeo gerado com sucesso pelo Luma AI.",
      files: [videoUrl]
    };
  } catch (error) {
    // Re-throw the error to be handled by the caller
    logError("VIDEO_GENERATION_ERROR", { error: error.message, prompt, params });
    throw error;
  }
}

// Function to handle Luma AI image generation
async function generateLumaImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", params);
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  if (!apiKey) {
    const error = "LUMA_API_KEY não está configurada";
    logError("CONFIG_ERROR", { message: error });
    throw new Error(error);
  }
  
  // Configure request payload
  const payload: any = {
    prompt: prompt,
    model: params?.model || "ray-2",
  };
  
  if (params?.style) {
    payload.style = params.style;
  }
  
  if (params?.aspectRatio) {
    payload.aspect_ratio = params.aspectRatio;
  }
  
  console.log("Enviando requisição para geração de imagem Luma AI:", payload);
  
  try {
    // Create generation
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/dream-machine/v1/image-generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
      3,
      2000
    );
    
    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      const errorDetails = `Erro ao criar geração de imagem Luma AI: ${generationResponse.status} ${errorText}`;
      logError("API_ERROR", { 
        status: generationResponse.status, 
        response: errorText,
        requestPayload: payload 
      });
      throw new Error(errorDetails);
    }
    
    const generationData = await generationResponse.json();
    const generationId = generationData.id;
    
    if (!generationId) {
      const error = "Falha ao obter ID de geração de imagem Luma AI";
      logError("API_ERROR", { message: error, response: generationData });
      throw new Error(error);
    }
    
    console.log("Geração de imagem Luma AI iniciada com ID:", generationId);
    
    // Poll for completion
    let imageUrl: string | null = null;
    let completed = false;
    let attempts = 0;
    const maxAttempts = 20; // 2 minutes with 6 second intervals
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Verificando status da geração de imagem (tentativa ${attempts}/${maxAttempts})...`);
        
        const statusResponse = await fetchWithRetry(
          `https://api.lumalabs.ai/dream-machine/v1/image-generations/${generationId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
          },
          3,
          1000
        );
        
        if (!statusResponse.ok) {
          console.error(`Erro ao verificar status de imagem: ${statusResponse.status}`);
          // Continue polling despite error
          await new Promise(resolve => setTimeout(resolve, 6000));
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`Status atual da imagem: ${statusData.state}`);
        
        if (statusData.state === "completed") {
          completed = true;
          imageUrl = statusData.assets?.image || null;
          console.log("Geração de imagem concluída com sucesso, URL:", imageUrl);
        } else if (statusData.state === "failed") {
          const error = `Geração de imagem falhou: ${statusData.failure_reason || "Motivo desconhecido"}`;
          logError("GENERATION_ERROR", { id: generationId, reason: statusData.failure_reason });
          throw new Error(error);
        } else {
          // Still processing, wait 6 seconds
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
      } catch (error) {
        console.error("Erro ao verificar status de imagem:", error);
        // Wait and continue
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }
    
    if (!completed) {
      const error = "Tempo limite excedido aguardando a geração da imagem";
      logError("TIMEOUT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    if (!imageUrl) {
      const error = "URL da imagem não disponível após conclusão";
      logError("RESULT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    return {
      content: "Imagem gerada com sucesso pelo Luma AI.",
      files: [imageUrl]
    };
  } catch (error) {
    // Re-throw the error to be handled by the caller
    logError("IMAGE_GENERATION_ERROR", { error: error.message, prompt, params });
    throw error;
  }
}

// Main handler for all AI chat requests
async function handleAIChat(req: Request): Promise<Response> {
  try {
    const { content, mode, modelId, files, params } = await req.json();
    console.log(`Recebida solicitação para modelo ${modelId} no modo ${mode}`, {
      contentLength: content?.length,
      filesCount: files?.length,
      params
    });
    
    let response: ResponseData = {
      content: "Não foi possível processar sua solicitação."
    };
    
    // Process based on model and mode
    if (modelId.includes("luma")) {
      if (mode === "video") {
        console.log("Iniciando processamento de vídeo com Luma AI");
        // Determine if we have an image for image-to-video
        const imageUrl = files && files.length > 0 ? files[0] : undefined;
        response = await generateLumaVideo(content, params, imageUrl);
        console.log("Processamento de vídeo concluído com sucesso");
      } else if (mode === "image") {
        console.log("Iniciando processamento de imagem com Luma AI");
        response = await generateLumaImage(content, params);
        console.log("Processamento de imagem concluído com sucesso");
      }
    } else if (modelId.includes("ideogram") && mode === "image") {
      // Mock response for other providers
      response = {
        content: "Imagem gerada pelo Ideogram (simulado).",
        files: ["https://via.placeholder.com/512x512?text=IdeogramAI"]
      };
    } else if (modelId.includes("kligin") && (mode === "image" || mode === "video")) {
      // Mock response for Kligin
      const mockFile = mode === "video" 
        ? "https://customer-mczvmistqo8sthk6.cloudflarestream.com/50c156acd139aba0c328fd1765e495e6/watch"
        : "https://via.placeholder.com/512x512?text=KliginAI";
        
      response = {
        content: `${mode === "video" ? "Vídeo" : "Imagem"} gerado pelo Kligin AI (simulado).`,
        files: [mockFile]
      };
    } else {
      // Default mock response for any other model/mode
      response = {
        content: `Resposta simulada para o modelo ${modelId} no modo ${mode}: ${content}`,
        files: mode === "text" ? undefined : ["https://via.placeholder.com/512x512?text=MockAI"]
      };
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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  // Handle API request
  return handleAIChat(req);
});
