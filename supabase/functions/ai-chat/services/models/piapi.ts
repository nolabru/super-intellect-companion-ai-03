import { corsHeaders } from "../../utils/cors.ts";

// PiAPI Token
const PIAPI_API_KEY = Deno.env.get("PIAPI_API_KEY") || "";
const MJ_API_KEY = Deno.env.get("MJ_API_KEY") || "";

// Base URLs
const PIAPI_BASE_URL = "https://api.piapi.ai";
const PIAPI_API_V1_URL = `${PIAPI_BASE_URL}/api/v1`;
const PIAPI_V1_URL = `${PIAPI_BASE_URL}/v1`;
const MJ_API_BASE_URL = "https://api.midjapi.com/v1";

// Function to verify API key
export function verifyApiKey() {
  if (!PIAPI_API_KEY) {
    throw new Error("PIAPI_API_KEY não está configurada");
  }
  return PIAPI_API_KEY;
}

// Verify Midjourney API key
export function verifyMjApiKey() {
  if (!MJ_API_KEY) {
    throw new Error("MJ_API_KEY não está configurada");
  }
  return MJ_API_KEY;
}

// Test API Key
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${PIAPI_V1_URL}/models/list`, {
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

// Create a task using PiAPI
export async function createPiapiTask(taskData: any): Promise<any> {
  verifyApiKey();
  
  try {
    console.log(`[PiAPI] Creating task with model ${taskData.model}...`);
    
    const response = await fetch(`${PIAPI_API_V1_URL}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error creating task: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[PiAPI] Task created successfully: ${data.task_id}`);
    
    return data;
  } catch (error) {
    console.error(`[PiAPI] Error in createPiapiTask: ${error.message}`);
    throw error;
  }
}

// Get task status from PiAPI
export async function getPiapiTaskStatus(taskId: string): Promise<any> {
  verifyApiKey();
  
  try {
    console.log(`[PiAPI] Getting status for task ${taskId}...`);
    
    const response = await fetch(`${PIAPI_API_V1_URL}/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error getting task status: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[PiAPI] Error in getPiapiTaskStatus: ${error.message}`);
    throw error;
  }
}

// Cancel task in PiAPI
export async function cancelPiapiTask(taskId: string): Promise<any> {
  verifyApiKey();
  
  try {
    console.log(`[PiAPI] Cancelling task ${taskId}...`);
    
    const response = await fetch(`${PIAPI_API_V1_URL}/task/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${PIAPI_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[PiAPI] Error cancelling task: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from PiAPI: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[PiAPI] Error in cancelPiapiTask: ${error.message}`);
    throw error;
  }
}

// Create a Midjourney imagine task
export async function createMidjourneyTask(prompt: string, mode: string = "fast"): Promise<any> {
  const mjApiKey = verifyMjApiKey();
  
  try {
    console.log(`[Midjourney] Creating imagine task with prompt: ${prompt}`);
    
    const response = await fetch(`${MJ_API_BASE_URL}/imagine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mjApiKey}`
      },
      body: JSON.stringify({
        prompt,
        mode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Midjourney] Error creating task: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from Midjourney API: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Midjourney] Task created successfully: ${data.task_id}`);
    
    return data;
  } catch (error) {
    console.error(`[Midjourney] Error in createMidjourneyTask: ${error.message}`);
    throw error;
  }
}

// Get Midjourney task status
export async function getMidjourneyTaskStatus(taskId: string): Promise<any> {
  const mjApiKey = verifyMjApiKey();
  
  try {
    console.log(`[Midjourney] Getting status for task ${taskId}...`);
    
    const response = await fetch(`${MJ_API_BASE_URL}/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mjApiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Midjourney] Error getting task status: ${JSON.stringify(errorData)}`);
      throw new Error(`Error from Midjourney API: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Midjourney] Error in getMidjourneyTaskStatus: ${error.message}`);
    throw error;
  }
}

// Generate image using PiAPI
export async function generateImage(
  prompt: string,
  modelId: string = "piapi-dalle-3"
) {
  verifyApiKey();
  
  let piapiModel = "";
  let taskData;
  let isFlux = false;
  let isMidjourney = false;
  
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
      isMidjourney = true;
      break;
    case "piapi-flux-dev":
      piapiModel = "Qubico/flux1-dev";
      isFlux = true;
      break;
    case "piapi-flux-schnell":
      piapiModel = "Qubico/flux1-schnell";
      isFlux = true;
      break;
    default:
      piapiModel = "dall-e-3"; // Default to DALL-E 3
  }
  
  try {
    console.log(`[PiAPI] Generating image with model ${piapiModel}...`);
    
    // Special handling for Flux models
    if (isFlux) {
      taskData = {
        "model": piapiModel,
        "task_type": "txt2img",
        "input": {
          "prompt": prompt,
          "negative_prompt": "",
          "guidance_scale": 7.5,
          "width": 768,
          "height": 768
        },
        "config": { 
          "webhook_config": { 
            "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
          } 
        }
      };
      
      // Create task
      const taskResponse = await createPiapiTask(taskData);
      
      return {
        content: `Imagem sendo gerada com ${piapiModel}. ID da tarefa: ${taskResponse.task_id}. ${prompt}`,
        taskId: taskResponse.task_id,
        status: "pending"
      };
    }
    
    // Special handling for Midjourney
    if (isMidjourney) {
      taskData = {
        "model": "midjourney",
        "task_type": "imagine",
        "input": {
          "prompt": prompt,
          "aspect_ratio": "1:1",
          "process_mode": "fast",
          "skip_prompt_check": false
        },
        "config": { 
          "webhook_config": { 
            "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
          },
          "service_mode": "public"
        }
      };
      
      // Create task
      const taskResponse = await createPiapiTask(taskData);
      
      return {
        content: `Imagem sendo gerada com Midjourney. ID da tarefa: ${taskResponse.task_id}. ${prompt}`,
        taskId: taskResponse.task_id,
        status: "pending"
      };
    }
    
    // Default flow for regular PiAPI models (backward compatibility)
    const response = await fetch(`${PIAPI_V1_URL}/images/generate`, {
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
  let taskType = "";
  let taskData;
  
  // Map our model IDs to PiAPI model IDs
  switch (params.modelId || "piapi-gen2") {
    case "piapi-gen2":
      piapiModel = "runway-gen2";
      break;
    case "piapi-pika":
      piapiModel = "pika";
      break;
    case "piapi-kling-text":
      piapiModel = "kling/text-to-video";
      taskType = "text-to-video";
      break;
    case "piapi-kling-image":
      piapiModel = "kling/image-to-video";
      taskType = "image-to-video";
      break;
    case "piapi-hunyuan-standard":
      piapiModel = "hunyuan/txt2video-standard";
      taskType = "txt2video-standard";
      break;
    case "piapi-hunyuan-fast":
      piapiModel = "hunyuan/txt2video-fast";
      taskType = "txt2video-standard";
      break;
    case "piapi-hailuo-text":
      piapiModel = "hailuo/t2v-01";
      taskType = "video_generation";
      break;
    case "piapi-hailuo-image":
      piapiModel = "hailuo/i2v-01";
      taskType = "video_generation";
      break;
    default:
      piapiModel = "runway-gen2"; // Default to Gen-2
  }
  
  try {
    console.log(`[PiAPI] Generating video with model ${piapiModel}...`);
    
    // For new PiAPI Task-based models
    if (taskType) {
      if (piapiModel === "kling/text-to-video") {
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "prompt": prompt,
            "duration": params.duration || 10,
            "aspect_ratio": params.aspectRatio || "16:9"
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel === "kling/image-to-video") {
        if (!imageUrl) {
          throw new Error("Image URL is required for image-to-video generation");
        }
        
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "image_url": imageUrl,
            "duration": params.duration || 8
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel.includes("hunyuan")) {
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "prompt": prompt,
            "duration": params.duration || 8
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel.includes("hailuo")) {
        if (piapiModel.includes("i2v") && !imageUrl) {
          throw new Error("Image URL is required for image-to-video generation");
        }
        
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": piapiModel.includes("i2v") ? 
            {
              "prompt": prompt,
              "image_url": imageUrl,
              "duration": params.duration || 6
            } : 
            {
              "prompt": prompt,
              "duration": params.duration || 6
            },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      }
      
      // Create task
      const taskResponse = await createPiapiTask(taskData);
      
      return {
        content: `Vídeo sendo gerado com ${piapiModel}. ID da tarefa: ${taskResponse.task_id}. ${prompt}`,
        taskId: taskResponse.task_id,
        status: "pending"
      };
    }
    
    // Legacy flow for backward compatibility
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
    
    const response = await fetch(`${PIAPI_V1_URL}/videos/generate`, {
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
  let taskType = "";
  let taskData;
  
  // Map our model IDs to PiAPI model IDs
  switch (params.modelId || "piapi-elevenlabs") {
    case "piapi-elevenlabs":
      piapiModel = "elevenlabs";
      break;
    case "piapi-openai-tts":
      piapiModel = "openai-tts";
      voiceId = "alloy"; // Default OpenAI voice
      break;
    case "piapi-mmaudio-video2audio":
      piapiModel = "mmaudio/video2audio";
      taskType = "video2audio";
      break;
    case "piapi-mmaudio-txt2audio":
      piapiModel = "mmaudio/txt2audio";
      taskType = "txt2audio";
      break;
    case "piapi-diffrhythm-base":
      piapiModel = "diffRhythm/txt2audio-base";
      taskType = "txt2audio-base";
      break;
    case "piapi-diffrhythm-full":
      piapiModel = "diffRhythm/txt2audio-full";
      taskType = "txt2audio-full";
      break;
    default:
      piapiModel = "elevenlabs"; // Default to ElevenLabs
  }
  
  try {
    console.log(`[PiAPI] Generating speech with model ${piapiModel}...`);
    
    // For new PiAPI Task-based models
    if (taskType) {
      if (piapiModel === "mmaudio/video2audio") {
        if (!params.videoUrl) {
          throw new Error("Video URL is required for video-to-audio generation");
        }
        
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "video": params.videoUrl,
            "prompt": text
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel === "mmaudio/txt2audio") {
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "prompt": text,
            "length": params.length || "90s"
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel === "diffRhythm/txt2audio-base") {
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "prompt": text,
            "length": params.length || "2m"
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      } else if (piapiModel === "diffRhythm/txt2audio-full") {
        taskData = {
          "model": piapiModel,
          "task_type": taskType,
          "input": {
            "lyrics": params.lyrics || text,
            "style_prompt": params.stylePrompt || "Pop music",
            "length": params.length || "3m"
          },
          "config": { 
            "webhook_config": { 
              "endpoint": `${Deno.env.get("SUPABASE_URL")}/functions/v1/piapi-media-webhook` 
            } 
          }
        };
      }
      
      // Create task
      const taskResponse = await createPiapiTask(taskData);
      
      return {
        content: `Áudio sendo gerado com ${piapiModel}. ID da tarefa: ${taskResponse.task_id}.`,
        taskId: taskResponse.task_id,
        status: "pending"
      };
    }
    
    // Legacy flow for backward compatibility
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
    
    const response = await fetch(`${PIAPI_V1_URL}/audio/generate`, {
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
