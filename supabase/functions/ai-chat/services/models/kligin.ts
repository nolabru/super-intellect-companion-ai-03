
import { fetchWithRetry, logError } from "../../utils/logging.ts";
import { validateApiKey } from "../../utils/validation.ts";

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

// Generate JWT token for Kligin API authentication using direct crypto APIs
async function generateJwtToken(): Promise<string> {
  try {
    // Check if we should use the provided fixed token for debugging
    const useFixedToken = Deno.env.get("USE_FIXED_KLIGIN_TOKEN") === "true";
    
    if (useFixedToken) {
      const fixedToken = Deno.env.get("FIXED_KLIGIN_TOKEN") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlZDcyOTlhMjA5OGE0YjA2YTVjYjMxYTUwYTk2ZGVjNCIsImV4cCI6MTc0NDg1MjM4MiwibmJmIjoxNzQ0ODUwNTc3fQ.oUuLkHvOW9xcl5w8cwh8KhQxZHdNoPejdMZKlZf8gk4";
      console.log(`[Kligin] Using fixed JWT token for debugging: ${fixedToken.substring(0, 20)}...`);
      return fixedToken;
    }
    
    // Get the current time
    const now = Math.floor(Date.now() / 1000);
    
    // Create the header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // Create the payload
    const payload = {
      iss: KLIGIN_API_KEY,
      exp: now + 1800, // Valid for 30 minutes
      nbf: now - 5     // Valid from 5 seconds ago
    };
    
    // Base64Url encode the header and payload
    const base64UrlEncode = (obj: any): string => {
      const jsonStr = JSON.stringify(obj);
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonStr);
      
      // Use btoa for base64 encoding and replace characters for base64url format
      let base64 = btoa(String.fromCharCode(...data));
      return base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };
    
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    
    // Create the signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    
    // Create the signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(KLIGIN_API_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signingInput)
    );
    
    // Convert signature to base64url
    const signatureArray = new Uint8Array(signature);
    let signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const signatureBase64Url = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    
    // Create the JWT token
    const jwt = `${encodedHeader}.${encodedPayload}.${signatureBase64Url}`;
    
    console.log(`[Kligin] Generated JWT token (preview): ${jwt.substring(0, 20)}...`);
    
    return jwt;
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
    
    // Generate a token for testing
    const token = await generateJwtToken();
    
    console.log(`[Kligin] Testing credentials with token: ${token.substring(0, 20)}...`);
    
    // Make a lightweight request to check if the credentials are valid
    const response = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/videos/text2video?pageNum=1&pageSize=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    }, 1, 2000); // Use only 1 retry for testing
    
    // Restore original credentials
    KLIGIN_API_KEY = originalKey;
    KLIGIN_API_SECRET = originalSecret;
    
    const isValid = response.status < 400;
    console.log(`[Kligin] Credentials test result: ${isValid ? 'Valid' : 'Invalid'} (Status code: ${response.status})`);
    
    return isValid;
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
    // Verificar a disponibilidade das credenciais
    const credentials = verifyApiCredentials();
    
    // Set credentials if they're different
    if (KLIGIN_API_KEY !== credentials.apiKey || KLIGIN_API_SECRET !== credentials.apiSecret) {
      setApiCredentials(credentials.apiKey, credentials.apiSecret);
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
      
      // Generate a new token for each poll to ensure freshness
      const pollToken = await generateJwtToken();
      
      // Check task status
      const taskCheckResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/videos/text2video/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pollToken}`
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
    // Verificar a disponibilidade das credenciais
    const credentials = verifyApiCredentials();
    
    // Set credentials if they're different
    if (KLIGIN_API_KEY !== credentials.apiKey || KLIGIN_API_SECRET !== credentials.apiSecret) {
      setApiCredentials(credentials.apiKey, credentials.apiSecret);
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
      
      // Generate a new token for each poll to ensure freshness
      const pollToken = await generateJwtToken();
      
      // Check task status
      const taskCheckResponse = await fetchWithRetry(`${KLIGIN_API_BASE_URL}/v1/images/text2image/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pollToken}`
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
