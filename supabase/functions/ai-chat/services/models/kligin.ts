
// Kligin API integration service

/**
 * This service integrates with the Kligin AI API for generating text, images and videos
 * API documentation: https://app.klingai.com/global/dev/document-api/quickStart/productIntroduction/overview
 */

import { logError } from "../../utils/logging.ts";

// Define response types
export interface KliginResponse {
  success: boolean;
  data?: {
    mediaUrl?: string;
    taskId?: string;
    status?: string;
    text?: string;
  };
  error?: string;
}

/**
 * Generate an image with Kligin AI
 */
export async function generateImage(prompt: string): Promise<KliginResponse> {
  try {
    const apiKey = Deno.env.get("KLIGIN_API_KEY");
    if (!apiKey) {
      throw new Error("KLIGIN_API_KEY não está configurada");
    }
    
    console.log("[Kligin] Gerando imagem com prompt:", prompt.substring(0, 100) + "...");
    
    const response = await fetch("https://app.klingai.com/api/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 1024,
        height: 1024,
        modelId: "default", // Usando o modelo padrão
        negative_prompt: "low quality, blurry, distorted"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Imagem gerada com sucesso:", result);
    
    return {
      success: true,
      data: {
        mediaUrl: result.imageUrl || result.url || result.data?.url,
        taskId: result.id || result.taskId
      }
    };
  } catch (error) {
    console.error("[Kligin] Erro ao gerar imagem:", error);
    logError("KLIGIN_IMAGE_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem"
    };
  }
}

/**
 * Generate a video with Kligin AI
 */
export async function generateVideo(prompt: string): Promise<KliginResponse> {
  try {
    const apiKey = Deno.env.get("KLIGIN_API_KEY");
    if (!apiKey) {
      throw new Error("KLIGIN_API_KEY não está configurada");
    }
    
    console.log("[Kligin] Gerando vídeo com prompt:", prompt.substring(0, 100) + "...");
    
    const response = await fetch("https://app.klingai.com/api/text-to-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: 5, // Duração em segundos
        resolution: "720p", // Resolução do vídeo
        modelId: "default", // Usando o modelo padrão
        negative_prompt: "low quality, blurry, distorted"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Solicitação de vídeo recebida com sucesso:", result);
    
    // Verificar se o vídeo foi gerado instantaneamente ou se é uma tarefa assíncrona
    if (result.status === "completed" && result.videoUrl) {
      return {
        success: true,
        data: {
          mediaUrl: result.videoUrl,
          status: "completed",
          taskId: result.id || result.taskId
        }
      };
    } else {
      // Retornar o ID da tarefa para consulta posterior
      return {
        success: true,
        data: {
          taskId: result.id || result.taskId,
          status: result.status || "pending"
        }
      };
    }
  } catch (error) {
    console.error("[Kligin] Erro ao gerar vídeo:", error);
    logError("KLIGIN_VIDEO_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao gerar vídeo"
    };
  }
}

/**
 * Check the status of a video generation task
 */
export async function checkVideoStatus(taskId: string): Promise<KliginResponse> {
  try {
    const apiKey = Deno.env.get("KLIGIN_API_KEY");
    if (!apiKey) {
      throw new Error("KLIGIN_API_KEY não está configurada");
    }
    
    console.log("[Kligin] Verificando status do vídeo com ID:", taskId);
    
    const response = await fetch(`https://app.klingai.com/api/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Status do vídeo:", result);
    
    return {
      success: true,
      data: {
        mediaUrl: result.videoUrl || result.url,
        status: result.status,
        taskId: taskId
      }
    };
  } catch (error) {
    console.error("[Kligin] Erro ao verificar status do vídeo:", error);
    logError("KLIGIN_STATUS_CHECK_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao verificar status do vídeo"
    };
  }
}
