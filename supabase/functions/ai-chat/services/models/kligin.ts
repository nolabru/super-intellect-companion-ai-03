
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
    
    // Using the correct endpoint from Kligin documentation
    const response = await fetch("https://api.kligin.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,                   // Number of images to generate
        size: "1024x1024",      // Image size
        response_format: "url"  // Return URL instead of base64
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Imagem gerada com sucesso:", result);
    
    // Handle response structure according to Kligin documentation
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: {
          mediaUrl: result.data[0].url
        }
      };
    } else if (result.url) {
      return {
        success: true,
        data: {
          mediaUrl: result.url
        }
      };
    } else if (result.imageUrl) {
      return {
        success: true,
        data: {
          mediaUrl: result.imageUrl
        }
      };
    } else {
      throw new Error("Resposta da API não contém URL da imagem");
    }
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
    
    // Using the correct endpoint for video generation
    const response = await fetch("https://api.kligin.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: 5,           // Duration in seconds
        resolution: "720p",    // Video resolution
        negative_prompt: "low quality, blurry, distorted"
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Solicitação de vídeo recebida com sucesso:", result);
    
    // Check if video was generated instantly or if it's an async task
    if (result.status === "completed" && (result.videoUrl || result.url)) {
      return {
        success: true,
        data: {
          mediaUrl: result.videoUrl || result.url,
          status: "completed",
          taskId: result.id || result.taskId
        }
      };
    } else if (result.id || result.taskId) {
      // Return the task ID for later status check
      return {
        success: true,
        data: {
          taskId: result.id || result.taskId,
          status: result.status || "pending"
        }
      };
    } else {
      throw new Error("Resposta da API não contém ID da tarefa ou URL do vídeo");
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
    
    const response = await fetch(`https://api.kligin.ai/v1/videos/generations/${taskId}`, {
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
