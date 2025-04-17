
// Kligin API integration service

/**
 * This service integrates with the Kligin AI API for generating text, images and videos
 * API documentation: https://app.klingai.com/global/dev/document-api/quickStart/productIntroduction/overview
 */

import { logError, logInfo } from "../../utils/logging.ts";
import { fetchWithRetry } from "../../utils/logging.ts";

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
      throw new Error("KLIGIN_API_KEY is not configured");
    }
    
    logInfo("KLIGIN_IMAGE_REQUEST", {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : "")
    });
    
    console.log("[Kligin] Generating image with prompt:", prompt.substring(0, 100) + "...");
    
    // Debug logging
    console.log("[Kligin] API Key configured correctly:", apiKey ? "Yes" : "No");
    
    // Use fetchWithRetry for multiple attempts and detailed logs
    const response = await fetchWithRetry("https://api.kligin.ai/v1/images/generations", {
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
    }, 3, 1000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kligin] API returned status ${response.status}:`, errorText);
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Image generated successfully:", result);
    
    // Handle response structure according to Kligin API response format
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: {
          mediaUrl: result.data[0].url
        }
      };
    } else if (result.data && result.data.url) {
      return {
        success: true,
        data: {
          mediaUrl: result.data.url
        }
      };
    } else if (result.url) {
      return {
        success: true,
        data: {
          mediaUrl: result.url
        }
      };
    } else {
      console.error("[Kligin] Unexpected API response:", result);
      throw new Error("API response does not contain image URL");
    }
  } catch (error) {
    console.error("[Kligin] Error generating image:", error);
    logError("KLIGIN_IMAGE_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error generating image"
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
      throw new Error("KLIGIN_API_KEY is not configured");
    }
    
    logInfo("KLIGIN_VIDEO_REQUEST", {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : "")
    });
    
    console.log("[Kligin] Generating video with prompt:", prompt.substring(0, 100) + "...");
    
    // Using the correct endpoint for video generation
    const response = await fetchWithRetry("https://api.kligin.ai/v1/videos/generations", {
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
    }, 3, 1000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kligin] API returned status ${response.status}:`, errorText);
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Video request received successfully:", result);
    
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
      console.error("[Kligin] Unexpected API response:", result);
      throw new Error("API response does not contain task ID or video URL");
    }
  } catch (error) {
    console.error("[Kligin] Error generating video:", error);
    logError("KLIGIN_VIDEO_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error generating video"
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
      throw new Error("KLIGIN_API_KEY is not configured");
    }
    
    console.log("[Kligin] Checking video status with ID:", taskId);
    
    const response = await fetchWithRetry(`https://api.kligin.ai/v1/videos/generations/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    }, 3, 1000);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kligin] API returned status ${response.status}:`, errorText);
      throw new Error(`Kligin API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[Kligin] Video status:", result);
    
    return {
      success: true,
      data: {
        mediaUrl: result.videoUrl || result.url,
        status: result.status,
        taskId: taskId
      }
    };
  } catch (error) {
    console.error("[Kligin] Error checking video status:", error);
    logError("KLIGIN_STATUS_CHECK_ERROR", { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error checking video status"
    };
  }
}
