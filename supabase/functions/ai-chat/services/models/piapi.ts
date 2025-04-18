import { corsHeaders } from "../../utils/cors.ts";

// PiAPI Token
const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";

// Function to verify API key
export function verifyApiKey() {
  if (!PIAPI_API_KEY) {
    throw new Error("PIAPI_API_KEY não está configurada");
  }
  return PIAPI_API_KEY;
}

// Base PiAPI URL
const PIAPI_BASE_URL = "https://api.piapi.ai/v1";

// Test API Key
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${PIAPI_BASE_URL}/models/list`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error(`[PiAPI] Error testing API key: ${error.message}`);
    return false;
  }
}

// Generate image using PiAPI
export async function generateImage(
  prompt: string,
  modelId: string = "piapi-dalle-3"
) {
  verifyApiKey();
  
  let piapiModel = "";
  
  // Map our model IDs to PiAPI model IDs
  switch (modelId) {
    case "piapi-dalle-3":
      piapiModel = "dall-e-3";
      break;
    case "piapi-sdxl":
      piapiModel = "stable-diffusion-xl";
      break;
    case "piapi-midjourney":
      piapiModel = "midjourney";
      break;
    default:
      piapiModel = "dall-e-3"; // Default to DALL-E 3
  }
  
  try {
    console.log(`[PiAPI] Generating image with model ${piapiModel}...`);
    
    const response = await fetch(`${PIAPI_BASE_URL}/images/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify({
        model: piapiModel,
        prompt: prompt,
        size: "1024x1024"
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error generating image: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.url) {
      throw new Error("No image URL received from PiAPI");
    }
    
    return {
      content: `Imagem gerada com sucesso usando ${piapiModel}. ${prompt}`,
      files: [data.data.url]
    };
  } catch (error) {
    console.error(`[PiAPI] Error in generateImage: ${error.message}`);
    throw error;
  }
}

// Generate video using PiAPI
export async function generateVideo(
  prompt: string,
  params: any = {},
  imageUrl?: string
) {
  verifyApiKey();
  
  let piapiModel = "";
  
  // Map our model IDs to PiAPI model IDs
  switch (params.modelId || "piapi-gen2") {
    case "piapi-gen2":
      piapiModel = "runway-gen2";
      break;
    case "piapi-pika":
      piapiModel = "pika";
      break;
    default:
      piapiModel = "runway-gen2"; // Default to Gen-2
  }
  
  try {
    console.log(`[PiAPI] Generating video with model ${piapiModel}...`);
    
    const requestBody: any = {
      model: piapiModel,
      prompt: prompt,
    };
    
    // Add image if provided
    if (imageUrl) {
      requestBody.init_image = imageUrl;
    }
    
    // Add optional parameters
    if (params.duration) {
      requestBody.duration = params.duration;
    }
    
    const response = await fetch(`${PIAPI_BASE_URL}/videos/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error generating video: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.url) {
      throw new Error("No video URL received from PiAPI");
    }
    
    return {
      content: `Vídeo gerado com sucesso usando ${piapiModel}. ${prompt}`,
      files: [data.data.url]
    };
  } catch (error) {
    console.error(`[PiAPI] Error in generateVideo: ${error.message}`);
    throw error;
  }
}

// Generate speech using PiAPI
export async function generateSpeech(
  text: string,
  params: any = {}
) {
  verifyApiKey();
  
  let piapiModel = "";
  let voiceId = params.voiceId || "eleven_monolingual_v1";
  
  // Map our model IDs to PiAPI model IDs
  switch (params.modelId || "piapi-elevenlabs") {
    case "piapi-elevenlabs":
      piapiModel = "elevenlabs";
      break;
    case "piapi-openai-tts":
      piapiModel = "openai-tts";
      voiceId = "alloy"; // Default OpenAI voice
      break;
    default:
      piapiModel = "elevenlabs"; // Default to ElevenLabs
  }
  
  try {
    console.log(`[PiAPI] Generating speech with model ${piapiModel}...`);
    
    const requestBody: any = {
      model: piapiModel,
      text: text,
      voice: voiceId
    };
    
    // Add optional parameters for ElevenLabs
    if (piapiModel === "elevenlabs") {
      if (params.stability) {
        requestBody.stability = params.stability;
      }
      if (params.similarityBoost) {
        requestBody.similarity_boost = params.similarityBoost;
      }
    }
    
    const response = await fetch(`${PIAPI_BASE_URL}/audio/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error generating speech: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.url) {
      throw new Error("No audio URL received from PiAPI");
    }
    
    return {
      content: `Áudio gerado com sucesso usando ${piapiModel}.`,
      files: [data.data.url]
    };
  } catch (error) {
    console.error(`[PiAPI] Error in generateSpeech: ${error.message}`);
    throw error;
  }
}
