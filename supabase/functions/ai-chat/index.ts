
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
      console.log(`Tentativa ${attempt + 1} para URL: ${url}`);
      const response = await fetch(url, options);
      
      // Log response status para debugging
      console.log(`Resposta recebida com status: ${response.status}`);
      
      // Se receber qualquer resposta, verifique o corpo para debug
      const responseClone = response.clone();
      try {
        const bodyText = await responseClone.text();
        console.log(`Corpo da resposta (${bodyText.length > 1000 ? bodyText.length + " chars" : "completo"}):`);
        if (bodyText.length <= 1000) {
          console.log(bodyText);
        } else {
          console.log(bodyText.substring(0, 1000) + "...");
        }
      } catch (e) {
        console.log("Não foi possível ler o corpo da resposta:", e);
      }
      
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
  
  console.log("Usando LUMA_API_KEY: " + apiKey.substring(0, 10) + "...");
  
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
    // Create generation - usando a API v2
    console.log("Chamando endpoint de geração de vídeo...");
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/v2/video-generations",
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
      } else if (status === 404) {
        throw new Error("Endpoint de API não encontrado. Verifique a documentação Luma AI para endpoints corretos.");
      } else {
        throw new Error(errorDetails);
      }
    }
    
    const generationData = await generationResponse.json();
    console.log("Resposta da API de geração:", JSON.stringify(generationData, null, 2));
    
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
        
        // Usar API v2
        const statusResponse = await fetchWithRetry(
          `https://api.lumalabs.ai/v2/video-generations/${generationId}`,
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
          
          // Verificação melhorada para encontrar a URL do vídeo
          if (statusData.video && statusData.video.url) {
            videoUrl = statusData.video.url;
          } else if (statusData.assets && statusData.assets.video) {
            videoUrl = statusData.assets.video;
          } else if (statusData.url) {
            videoUrl = statusData.url;
          } else {
            console.log("Estrutura de resposta completa:", JSON.stringify(statusData, null, 2));
            // Tentar encontrar qualquer URL no objeto
            const findUrlInObject = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              
              for (const key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('http') && (obj[key].endsWith('.mp4') || obj[key].includes('video'))) {
                  return obj[key];
                } else if (typeof obj[key] === 'object') {
                  const found = findUrlInObject(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            
            videoUrl = findUrlInObject(statusData);
          }
          
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
  
  console.log("Usando LUMA_API_KEY: " + apiKey.substring(0, 10) + "...");
  
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
    // Create generation - usando a API v2
    console.log("Chamando endpoint de geração de imagem...");
    const generationResponse = await fetchWithRetry(
      "https://api.lumalabs.ai/v2/image-generations",
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
      } else if (status === 404) {
        throw new Error("Endpoint de API não encontrado. Verifique a documentação Luma AI para endpoints corretos.");
      } else {
        throw new Error(errorDetails);
      }
    }
    
    const generationData = await generationResponse.json();
    console.log("Resposta da API de geração de imagem:", JSON.stringify(generationData, null, 2));
    
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
        
        // Usar API v2
        const statusResponse = await fetchWithRetry(
          `https://api.lumalabs.ai/v2/image-generations/${generationId}`,
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
          
          // Verificação melhorada para encontrar a URL da imagem
          if (statusData.image && statusData.image.url) {
            imageUrl = statusData.image.url;
          } else if (statusData.assets && statusData.assets.image) {
            imageUrl = statusData.assets.image;
          } else if (statusData.url) {
            imageUrl = statusData.url;
          } else {
            console.log("Estrutura de resposta completa:", JSON.stringify(statusData, null, 2));
            // Tentar encontrar qualquer URL no objeto
            const findUrlInObject = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              
              for (const key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('http') && (obj[key].endsWith('.jpg') || obj[key].endsWith('.png') || obj[key].includes('image'))) {
                  return obj[key];
                } else if (typeof obj[key] === 'object') {
                  const found = findUrlInObject(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            
            imageUrl = findUrlInObject(statusData);
          }
          
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
      console.log("Validando a API key da Luma...");
      
      // Test API key validity
      try {
        const testResponse = await fetch("https://api.lumalabs.ai/v2/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKeyToUse}`,
          },
        });
        
        const responseText = await testResponse.text();
        console.log(`Resposta do teste de API key: ${testResponse.status} - ${responseText}`);
        
        if (!testResponse.ok) {
          logError("INVALID_API_KEY", { status: testResponse.status, response: responseText });
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
        } else {
          console.log("API key validada com sucesso!");
        }
      } catch (error) {
        logError("API_KEY_TEST_ERROR", { error: error instanceof Error ? error.message : String(error) });
        console.log("Aviso: Erro ao testar API key, mas continuando mesmo assim");
        // Continue even if test fails, the actual request might still work
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
