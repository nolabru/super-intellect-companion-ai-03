
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

// Enhanced error logging function with detailed information
function logError(errorType: string, details: any) {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    type: errorType,
    details: details
  };
  
  console.error(`AI-CHAT ERROR [${errorType}] [${timestamp}]:`, JSON.stringify(errorLog, null, 2));
}

// Function to handle requests with retries and exponential backoff
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
      
      // If we get a 429 (Too Many Requests) or 5xx (Server Error), wait and retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        console.log(`Request failed with status ${response.status} (attempt ${attempt + 1}/${maxRetries}), waiting before retry...`);
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
  console.log("Iniciando geração de vídeo Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
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
  
  console.log(`Enviando requisição para Luma AI (${isImageToVideo ? 'Image-to-Video' : 'Text-to-Video'}):`, JSON.stringify(payload, null, 2));
  
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
      const status = generationResponse.status;
      const errorDetails = `Erro ao criar geração Luma AI: ${status} ${errorText}`;
      logError("API_ERROR", { 
        status: status, 
        response: errorText,
        requestPayload: payload 
      });
      
      if (status === 401) {
        throw new Error("API Key inválida ou expirada. Verifique suas credenciais Luma AI.");
      } else if (status === 400) {
        throw new Error(`Erro na requisição: ${errorText}`);
      } else {
        throw new Error(errorDetails);
      }
    }
    
    const generationData = await generationResponse.json();
    const generationId = generationData.id;
    
    if (!generationId) {
      const error = "Falha ao obter ID de geração Luma AI";
      logError("API_ERROR", { message: error, response: generationData });
      throw new Error(error);
    }
    
    console.log("Geração Luma AI iniciada com ID:", generationId);
    
    // Poll for completion (up to 5 minutes)
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
          const errorText = await statusResponse.text();
          console.error(`Erro ao verificar status: ${statusResponse.status} - ${errorText}`);
          // Continue polling despite error
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`Status atual: ${statusData.state} (tentativa ${attempts}/${maxAttempts})`);
        
        if (statusData.state === "completed") {
          completed = true;
          videoUrl = statusData.assets?.video || null;
          console.log("Geração concluída com sucesso, URL do vídeo:", videoUrl);
        } else if (statusData.state === "failed") {
          const failureReason = statusData.failure_reason || "Motivo desconhecido";
          const error = `Geração falhou: ${failureReason}`;
          logError("GENERATION_ERROR", { id: generationId, reason: failureReason });
          throw new Error(error);
        } else {
          // Still processing, wait 10 seconds
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        logError("STATUS_CHECK_ERROR", { 
          id: generationId, 
          attempt: attempts, 
          error: error instanceof Error ? error.message : String(error) 
        });
        // Wait and continue
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (!completed) {
      const error = "Tempo limite excedido aguardando a geração do vídeo";
      logError("TIMEOUT_ERROR", { id: generationId, attempts });
      throw new Error(error);
    }
    
    if (!videoUrl) {
      const error = "URL do vídeo não disponível após conclusão";
      logError("RESULT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    console.log("Vídeo gerado com sucesso, retornando URL:", videoUrl);
    
    return {
      content: "Vídeo gerado com sucesso pelo Luma AI.",
      files: [videoUrl]
    };
  } catch (error) {
    // Re-throw the error to be handled by the caller
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("VIDEO_GENERATION_ERROR", { 
      error: errorMessage, 
      prompt, 
      params,
      imageUrl: imageUrl ? "Present" : "Not provided" 
    });
    throw error;
  }
}

// Function to handle Luma AI image generation
async function generateLumaImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
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
  
  console.log("Enviando requisição para geração de imagem Luma AI:", JSON.stringify(payload, null, 2));
  
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
      const status = generationResponse.status;
      const errorDetails = `Erro ao criar geração de imagem Luma AI: ${status} ${errorText}`;
      logError("API_ERROR", { 
        status: status, 
        response: errorText,
        requestPayload: payload 
      });
      
      if (status === 401) {
        throw new Error("API Key inválida ou expirada. Verifique suas credenciais Luma AI.");
      } else if (status === 400) {
        throw new Error(`Erro na requisição: ${errorText}`);
      } else {
        throw new Error(errorDetails);
      }
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
          const errorText = await statusResponse.text();
          console.error(`Erro ao verificar status de imagem: ${statusResponse.status} - ${errorText}`);
          // Continue polling despite error
          await new Promise(resolve => setTimeout(resolve, 6000));
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`Status atual da imagem: ${statusData.state} (tentativa ${attempts}/${maxAttempts})`);
        
        if (statusData.state === "completed") {
          completed = true;
          imageUrl = statusData.assets?.image || null;
          console.log("Geração de imagem concluída com sucesso, URL:", imageUrl);
        } else if (statusData.state === "failed") {
          const failureReason = statusData.failure_reason || "Motivo desconhecido";
          const error = `Geração de imagem falhou: ${failureReason}`;
          logError("GENERATION_ERROR", { id: generationId, reason: failureReason });
          throw new Error(error);
        } else {
          // Still processing, wait 6 seconds
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
      } catch (error) {
        console.error("Erro ao verificar status de imagem:", error);
        logError("STATUS_CHECK_ERROR", { 
          id: generationId, 
          attempt: attempts, 
          error: error instanceof Error ? error.message : String(error) 
        });
        // Wait and continue
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }
    
    if (!completed) {
      const error = "Tempo limite excedido aguardando a geração da imagem";
      logError("TIMEOUT_ERROR", { id: generationId, attempts });
      throw new Error(error);
    }
    
    if (!imageUrl) {
      const error = "URL da imagem não disponível após conclusão";
      logError("RESULT_ERROR", { id: generationId });
      throw new Error(error);
    }
    
    console.log("Imagem gerada com sucesso, retornando URL:", imageUrl);
    
    return {
      content: "Imagem gerada com sucesso pelo Luma AI.",
      files: [imageUrl]
    };
  } catch (error) {
    // Re-throw the error to be handled by the caller
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("IMAGE_GENERATION_ERROR", { error: errorMessage, prompt, params });
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
      paramsPreview: params ? JSON.stringify(params).substring(0, 100) : 'none'
    });
    
    let response: ResponseData = {
      content: "Não foi possível processar sua solicitação."
    };
    
    // Validate API key for Luma models
    if (modelId.includes("luma")) {
      const apiKey = Deno.env.get("LUMA_API_KEY");
      if (!apiKey) {
        logError("MISSING_API_KEY", { model: modelId, mode });
        return new Response(
          JSON.stringify({
            content: "Erro: A chave de API do Luma não está configurada. Por favor, configure esta chave nas configurações do projeto.",
            error: "LUMA_API_KEY não configurada",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }
    
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
