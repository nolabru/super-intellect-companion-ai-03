
import { fetchWithRetry, logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";
// Import JWT from a Deno-compatible CDN URL instead of using a bare import
import * as jwt from "https://deno.land/x/djwt@v2.8/mod.ts";

// Kligin API base URL
const KLIGIN_API_BASE_URL = "https://api.klingai.com";

// API credentials
let KLIGIN_API_KEY = "";
let KLIGIN_API_SECRET = "";

// Set API credentials for authentication
export function setApiCredentials(apiKey: string, apiSecret: string) {
  console.log("[Kligin] Setting API credentials");
  KLIGIN_API_KEY = apiKey;
  KLIGIN_API_SECRET = apiSecret;
}

// Generate JWT token for Kligin API authentication
async function generateJwtToken(): Promise<string> {
  try {
    // Check if we should use the provided fixed token for debugging
    const useFixedToken = Deno.env.get("USE_FIXED_KLIGIN_TOKEN") === "true";
    
    if (useFixedToken) {
      console.log("[Kligin] Using fixed JWT token for debugging");
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlZDcyOTlhMjA5OGE0YjA2YTVjYjMxYTUwYTk2ZGVjNCIsImV4cCI6MTc0NDg1MjM4MiwibmJmIjoxNzQ0ODUwNTc3fQ.oUuLkHvOW9xcl5w8cwh8KhQxZHdNoPejdMZKlZf8gk4";
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    const payload = {
      iss: KLIGIN_API_KEY,
      exp: now + 1800, // Valid for 30 minutes
      nbf: now - 5     // Valid from 5 seconds ago
    };
    
    // Create the JWT token using Deno's JWT library
    return await jwt.create(header, payload, new TextEncoder().encode(KLIGIN_API_SECRET));
  } catch (error) {
    console.error("[Kligin] Error generating JWT token:", error);
    throw new Error("Falha ao gerar token JWT para autenticação Kligin");
  }
}

// Verify API credentials are set
export function verifyApiCredentials(): { apiKey: string, apiSecret: string } {
  const apiKey = Deno.env.get("KLIGIN_API_KEY") || KLIGIN_API_KEY;
  const apiSecret = Deno.env.get("KLIGIN_API_SECRET") || KLIGIN_API_SECRET;
  
  if (!apiKey) {
    throw new Error("KLIGIN_API_KEY não configurada nas variáveis de ambiente");
  }
  
  if (!apiSecret) {
    throw new Error("KLIGIN_API_SECRET não configurada nas variáveis de ambiente");
  }
  
  return { apiKey, apiSecret };
}

// Verify API key is valid
export function verifyApiKey(): string {
  const apiKey = Deno.env.get("KLIGIN_API_KEY") || KLIGIN_API_KEY;
  validateApiKey("KLIGIN_API_KEY", apiKey);
  
  const apiSecret = Deno.env.get("KLIGIN_API_SECRET") || KLIGIN_API_SECRET;
  validateApiKey("KLIGIN_API_SECRET", apiSecret);
  
  return apiKey;
}

// Test API key validity
export async function testApiCredentials(apiKey: string, apiSecret: string): Promise<boolean> {
  try {
    // Set credentials temporarily for the test
    const originalKey = KLIGIN_API_KEY;
    const originalSecret = KLIGIN_API_SECRET;
    
    KLIGIN_API_KEY = apiKey;
    KLIGIN_API_SECRET = apiSecret;
    
    // Generate a token for authentication
    const token = await generateJwtToken();
    
    // Make a lightweight request to check if the credentials are valid
    const response = await fetch(`${KLIGIN_API_BASE_URL}/v1/videos/text2video?pageNum=1&pageSize=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    // Restore original credentials
    KLIGIN_API_KEY = originalKey;
    KLIGIN_API_SECRET = originalSecret;
    
    return response.status < 400;
  } catch (error) {
    console.error("[Kligin] Error testing API credentials:", error);
    return false;
  }
}

// Generate video using Kligin API
export async function generateVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
): Promise<{ content: string; files?: string[] }> {
  try {
    // For debugging, check if we should use fixed credentials
    const useFixedCredentials = Deno.env.get("USE_FIXED_KLIGIN_CREDENTIALS") === "true";
    
    if (useFixedCredentials) {
      console.log("[Kligin] Using fixed credentials for debugging");
      const fixedApiKey = Deno.env.get("FIXED_KLIGIN_API_KEY") || "ed7299a2098a4b06a5cb31a50a96dec4";
      const fixedApiSecret = Deno.env.get("FIXED_KLIGIN_API_SECRET") || "f2cd56e7a4af4fdca8d27291bad9efde";
      setApiCredentials(fixedApiKey, fixedApiSecret);
    } else {
      const credentials = verifyApiCredentials();
      
      // Set credentials if they're different
      if (KLIGIN_API_KEY !== credentials.apiKey || KLIGIN_API_SECRET !== credentials.apiSecret) {
        setApiCredentials(credentials.apiKey, credentials.apiSecret);
      }
    }
    
    console.log(`[Kligin] Generating video with prompt: "${prompt.substring(0, 50)}..."`);
    
    // Generate JWT token for authentication
    const token = await generateJwtToken();
    console.log(`[Kligin] Using JWT token: ${token.substring(0, 20)}...`);
    
    // Default video parameters
    const videoParams = {
      prompt: prompt,
      negative_prompt: params?.negative_prompt || "",
      model_name: params?.model || "kling-v1",
      cfg_scale: params?.cfg_scale || 0.5,
      mode: params?.mode || "std",
      aspect_ratio: params?.aspect_ratio || "16:9",
      duration: params?.duration || "5",
      ...params?.camera_control && { camera_control: params.camera_control }
    };
    
    console.log(`[Kligin] Video generation parameters:`, JSON.stringify(videoParams, null, 2));
    
    // Submit video generation task
    const createTaskResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/videos/text2video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(videoParams)
    }, 3, 2000);
    
    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error(`[Kligin] Error creating video task: ${errorText}`);
      throw new Error(`Erro ao criar tarefa de vídeo: ${createTaskResponse.status} - ${errorText}`);
    }
    
    const createTaskResult = await createTaskResponse.json();
    const taskId = createTaskResult.data?.task_id;
    
    if (!taskId) {
      throw new Error("Não foi possível obter o ID da tarefa de vídeo");
    }
    
    console.log(`[Kligin] Video generation task created with ID: ${taskId}`);
    
    // Poll for task completion with timeout
    const startTime = Date.now();
    const MAX_POLL_TIME = 180000; // 3 minutes timeout
    const POLL_INTERVAL = 5000; // 5 seconds between polls
    
    let videoUrl: string | null = null;
    
    while (Date.now() - startTime < MAX_POLL_TIME) {
      // Wait between polls
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
      // Generate a fresh token for each poll to avoid expiration
      const freshToken = await generateJwtToken();
      
      // Check task status
      const taskCheckResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/videos/text2video/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${freshToken}`
        }
      }, 3, 2000);
      
      if (!taskCheckResponse.ok) {
        console.warn(`[Kligin] Error checking task status: ${taskCheckResponse.status}`);
        continue; // Try again on next poll
      }
      
      const taskStatus = await taskCheckResponse.json();
      console.log(`[Kligin] Task status: ${taskStatus.data?.task_status}`);
      
      if (taskStatus.data?.task_status === "succeed") {
        // Task completed successfully
        if (taskStatus.data?.task_result?.videos?.length > 0) {
          videoUrl = taskStatus.data.task_result.videos[0].url;
          console.log(`[Kligin] Video ready at URL: ${videoUrl}`);
          break;
        }
      } else if (taskStatus.data?.task_status === "failed") {
        throw new Error(`Falha na geração de vídeo: ${taskStatus.data?.task_status_msg || "Erro desconhecido"}`);
      }
      
      // Still processing, continue polling
      console.log(`[Kligin] Video still processing, polling again in ${POLL_INTERVAL / 1000} seconds...`);
    }
    
    // Check if we timed out
    if (!videoUrl) {
      // Return the task ID so the frontend can check status later
      return {
        content: `A geração de vídeo está em andamento, mas excedeu o tempo de espera. Você pode verificar o status mais tarde. ID: ${taskId}`,
        files: []
      };
    }
    
    return {
      content: `Vídeo gerado com sucesso! Aqui está seu vídeo baseado no prompt: "${prompt}"`,
      files: [videoUrl]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("KLIGIN_VIDEO_ERROR", { error: errorMessage, prompt });
    throw new Error(`Erro na geração de vídeo: ${errorMessage}`);
  }
}

// Generate image using Kligin API
export async function generateImage(
  prompt: string,
  params: any = {},
): Promise<{ content: string; files?: string[] }> {
  try {
    // For debugging, check if we should use fixed credentials
    const useFixedCredentials = Deno.env.get("USE_FIXED_KLIGIN_CREDENTIALS") === "true";
    
    if (useFixedCredentials) {
      console.log("[Kligin] Using fixed credentials for debugging");
      const fixedApiKey = Deno.env.get("FIXED_KLIGIN_API_KEY") || "ed7299a2098a4b06a5cb31a50a96dec4";
      const fixedApiSecret = Deno.env.get("FIXED_KLIGIN_API_SECRET") || "f2cd56e7a4af4fdca8d27291bad9efde";
      setApiCredentials(fixedApiKey, fixedApiSecret);
    } else {
      const credentials = verifyApiCredentials();
      
      // Set credentials if they're different
      if (KLIGIN_API_KEY !== credentials.apiKey || KLIGIN_API_SECRET !== credentials.apiSecret) {
        setApiCredentials(credentials.apiKey, credentials.apiSecret);
      }
    }
    
    console.log(`[Kligin] Generating image with prompt: "${prompt.substring(0, 50)}..."`);
    
    // Generate JWT token for authentication
    const token = await generateJwtToken();
    console.log(`[Kligin] Using JWT token: ${token.substring(0, 20)}...`);
    
    // Default image parameters
    const imageParams = {
      prompt: prompt,
      negative_prompt: params?.negative_prompt || "",
      model_name: params?.model || "kling-v1",
      cfg_scale: params?.cfg_scale || 0.7,
      aspect_ratio: params?.aspect_ratio || "1:1"
    };
    
    console.log(`[Kligin] Image generation parameters:`, JSON.stringify(imageParams, null, 2));
    
    // Submit image generation task
    const createTaskResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/images/text2image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(imageParams)
    }, 3, 2000);
    
    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error(`[Kligin] Error creating image task: ${errorText}`);
      throw new Error(`Erro ao criar tarefa de imagem: ${createTaskResponse.status} - ${errorText}`);
    }
    
    const createTaskResult = await createTaskResponse.json();
    const taskId = createTaskResult.data?.task_id;
    
    if (!taskId) {
      throw new Error("Não foi possível obter o ID da tarefa de imagem");
    }
    
    console.log(`[Kligin] Image generation task created with ID: ${taskId}`);
    
    // Poll for task completion with timeout
    const startTime = Date.now();
    const MAX_POLL_TIME = 60000; // 1 minute timeout for images
    const POLL_INTERVAL = 2000; // 2 seconds between polls
    
    let imageUrl: string | null = null;
    
    while (Date.now() - startTime < MAX_POLL_TIME) {
      // Wait between polls
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
      // Generate a fresh token for each poll to avoid expiration
      const freshToken = await generateJwtToken();
      
      // Check task status
      const taskCheckResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/images/text2image/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${freshToken}`
        }
      }, 3, 2000);
      
      if (!taskCheckResponse.ok) {
        console.warn(`[Kligin] Error checking task status: ${taskCheckResponse.status}`);
        continue; // Try again on next poll
      }
      
      const taskStatus = await taskCheckResponse.json();
      console.log(`[Kligin] Task status: ${taskStatus.data?.task_status}`);
      
      if (taskStatus.data?.task_status === "succeed") {
        // Task completed successfully
        if (taskStatus.data?.task_result?.images?.length > 0) {
          imageUrl = taskStatus.data.task_result.images[0].url;
          console.log(`[Kligin] Image ready at URL: ${imageUrl}`);
          break;
        }
      } else if (taskStatus.data?.task_status === "failed") {
        throw new Error(`Falha na geração de imagem: ${taskStatus.data?.task_status_msg || "Erro desconhecido"}`);
      }
      
      // Still processing, continue polling
      console.log(`[Kligin] Image still processing, polling again in ${POLL_INTERVAL / 1000} seconds...`);
    }
    
    // Check if we timed out
    if (!imageUrl) {
      // Return the task ID so the frontend can check status later
      return {
        content: `A geração de imagem está em andamento, mas excedeu o tempo de espera. Você pode verificar o status mais tarde. ID: ${taskId}`,
        files: []
      };
    }
    
    return {
      content: `Imagem gerada com sucesso! Aqui está sua imagem baseada no prompt: "${prompt}"`,
      files: [imageUrl]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("KLIGIN_IMAGE_ERROR", { error: errorMessage, prompt });
    throw new Error(`Erro na geração de imagem: ${errorMessage}`);
  }
}
