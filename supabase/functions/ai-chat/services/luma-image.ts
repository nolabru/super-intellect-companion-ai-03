
import { fetchWithRetry } from "../utils/logging.ts";
import { logError } from "../utils/logging.ts";
import { validateApiKey } from "../utils/validation.ts";

// Define response type
export interface ResponseData {
  content: string;
  files?: string[];
}

// Function to handle Luma AI image generation
export async function generateLumaImage(
  prompt: string,
  params: any = {}
): Promise<ResponseData> {
  console.log("Iniciando geração de imagem Luma AI com parâmetros:", JSON.stringify(params, null, 2));
  
  const apiKey = Deno.env.get("LUMA_API_KEY");
  validateApiKey("LUMA_API_KEY", apiKey);
  
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
