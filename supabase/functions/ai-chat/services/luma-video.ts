
import { fetchWithRetry } from "../utils/logging.ts";
import { logError } from "../utils/logging.ts";
import { validateApiKey } from "../utils/validation.ts";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Function to handle Luma AI video generation
export async function generateLumaVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
): Promise<ResponseData> {
  console.log("Iniciando geração de vídeo Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  validateApiKey("LUMA_API_KEY", apiKey);
  
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
