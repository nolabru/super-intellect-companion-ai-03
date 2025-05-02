import { toast } from 'sonner';

/**
 * Type definitions for PiAPI service
 */
export type PiapiMediaType = 'image' | 'video' | 'audio';

export type PiapiImageModel = 
  'flux-dev' | 
  'flux-schnell' | 
  'dall-e-3' | 
  'sdxl' | 
  'midjourney';

export type PiapiVideoModel = 
  'kling-text' | 
  'kling-image' | 
  'hunyuan-standard' | 
  'hunyuan-fast' | 
  'hailuo-text' | 
  'hailuo-image';

export type PiapiAudioModel = 
  'mmaudio-txt2audio' | 
  'mmaudio-video2audio' |
  'diffrhythm-base' | 
  'diffrhythm-full' | 
  'elevenlabs';

export type PiapiModel = PiapiImageModel | PiapiVideoModel | PiapiAudioModel;

export interface PiapiParams {
  [key: string]: any;
}

export interface PiapiTaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

// Define a type for task info stored in localStorage
interface StoredTaskInfo {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  prompt?: string;
  mediaType: PiapiMediaType;
  mediaUrl?: string;
  error?: string;
  params?: PiapiParams;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Storage key for the PiAPI API key in localStorage
 */
const PIAPI_KEY_STORAGE = 'piapi_api_key';

/**
 * Base URL for PiAPI
 */
const PIAPI_API_BASE_URL = "https://api.piapi.ai/api/v1";

/**
 * Get the PiAPI API key from localStorage
 */
export const getPiapiApiKey = (): string | null => {
  return localStorage.getItem(PIAPI_KEY_STORAGE);
};

/**
 * Set the PiAPI API key in localStorage
 */
export const setPiapiApiKey = (apiKey: string): void => {
  localStorage.setItem(PIAPI_KEY_STORAGE, apiKey);
};

/**
 * Clear the PiAPI API key from localStorage
 */
export const clearPiapiApiKey = (): void => {
  localStorage.removeItem(PIAPI_KEY_STORAGE);
};

/**
 * Check if the PiAPI API key is set
 */
export const hasPiapiApiKey = (): boolean => {
  return !!getPiapiApiKey();
};

/**
 * Initialize PiAPI service with API key
 */
export const initPiapiService = (apiKey: string): boolean => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      toast.error('A chave de API da PiAPI não pode estar vazia');
      return false;
    }
    
    setPiapiApiKey(apiKey);
    toast.success('Chave de API da PiAPI configurada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar serviço PiAPI:', error);
    toast.error('Erro ao configurar chave de API');
    return false;
  }
};

/**
 * Direct PiAPI service for frontend
 */
export const piapiDirectService = {
  /**
   * Get the API key or throw error if not set
   */
  getApiKey(): string {
    const apiKey = getPiapiApiKey();
    if (!apiKey) {
      throw new Error('PiAPI API key not configured');
    }
    return apiKey;
  },

  /**
   * Generate an image using PiAPI
   */
  async generateImage(
    prompt: string,
    model: PiapiImageModel = 'flux-schnell',
    params: PiapiParams = {}
  ): Promise<PiapiTaskResult> {
    try {
      console.log(`[piapiDirectService] Generating image with model ${model}`);
      
      if (!prompt || prompt.trim() === '') {
        throw new Error('Prompt is required');
      }

      const apiKey = this.getApiKey();
      
      // Map frontend model names to PiAPI model names
      let piapiModel;
      switch (model) {
        case 'flux-dev':
          piapiModel = 'Qubico/flux1-dev';
          break;
        case 'flux-schnell':
          piapiModel = 'Qubico/flux1-schnell';
          break;
        case 'dall-e-3':
          piapiModel = 'dall-e-3';
          break;
        case 'sdxl':
          piapiModel = 'stable-diffusion-xl';
          break;
        default:
          piapiModel = 'Qubico/flux1-schnell';
      }

      // Prepare task data
      const taskData = {
        "model": piapiModel,
        "task_type": "txt2img",
        "input": {
          "prompt": prompt,
          "negative_prompt": params.negativePrompt || "",
          "guidance_scale": params.guidanceScale || 7.5,
          "width": params.width || 768,
          "height": params.height || 768
        }
      };

      console.log(`[piapiDirectService] Sending image generation request:`, 
        JSON.stringify(taskData, null, 2));

      // Create task in PiAPI
      const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[piapiDirectService] Error from PiAPI:`, errorData);
        throw new Error(`PiAPI Error: ${errorData.error?.message || response.statusText}`);
      }

      // Parse response
      const responseData = await response.json();
      const taskId = responseData.task_id;
      
      console.log(`[piapiDirectService] Task created successfully. ID: ${taskId}`);

      // Store task in localStorage for persistence
      this.storeTask(taskId, {
        taskId,
        status: 'pending',
        model: piapiModel,
        prompt,
        mediaType: 'image',
        params: params
      });

      return {
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error(`[piapiDirectService] Error generating image:`, error);
      throw error;
    }
  },

  /**
   * Generate video using PiAPI
   */
  async generateVideo(
    prompt: string,
    model: PiapiVideoModel = 'kling-text',
    params: PiapiParams = {},
    imageUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      console.log(`[piapiDirectService] Generating video with model ${model}`);
      
      if (model.includes('image') && !imageUrl) {
        throw new Error('Image URL is required for image-based video models');
      }
      
      if (!model.includes('image') && (!prompt || prompt.trim() === '')) {
        throw new Error('Prompt is required for text-based video models');
      }

      const apiKey = this.getApiKey();
      
      // Map frontend model names to PiAPI model names and task types
      let piapiModel;
      let taskType;
      let inputData: Record<string, any> = {};
      
      switch (model) {
        case 'kling-text':
          piapiModel = 'kling/text-to-video';
          taskType = 'text-to-video';
          inputData = {
            "prompt": prompt,
            "duration": params.duration || 10,
            "aspect_ratio": params.aspectRatio || "16:9"
          };
          break;
        case 'kling-image':
          piapiModel = 'kling/image-to-video';
          taskType = 'image-to-video';
          inputData = {
            "image_url": imageUrl,
            "duration": params.duration || 8
          };
          break;
        case 'hunyuan-fast':
          piapiModel = 'hunyuan/txt2video-fast';
          taskType = 'txt2video-standard';
          inputData = {
            "prompt": prompt,
            "duration": params.duration || 8
          };
          break;
        case 'hunyuan-standard':
          piapiModel = 'hunyuan/txt2video-standard';
          taskType = 'txt2video-standard';
          inputData = {
            "prompt": prompt,
            "duration": params.duration || 8
          };
          break;
        case 'hailuo-text':
          piapiModel = 'hailuo/t2v-01';
          taskType = 'video_generation';
          inputData = {
            "prompt": prompt,
            "duration": params.duration || 6
          };
          break;
        case 'hailuo-image':
          piapiModel = 'hailuo/i2v-01';
          taskType = 'video_generation';
          inputData = {
            "prompt": prompt,
            "image_url": imageUrl,
            "duration": params.duration || 6
          };
          break;
        default:
          piapiModel = 'kling/text-to-video';
          taskType = 'text-to-video';
          inputData = {
            "prompt": prompt,
            "duration": params.duration || 10,
            "aspect_ratio": params.aspectRatio || "16:9"
          };
      }

      // Prepare task data
      const taskData = {
        "model": piapiModel,
        "task_type": taskType,
        "input": inputData
      };

      console.log(`[piapiDirectService] Sending video generation request:`, 
        JSON.stringify(taskData, null, 2));

      // Create task in PiAPI
      const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[piapiDirectService] Error from PiAPI:`, errorData);
        throw new Error(`PiAPI Error: ${errorData.error?.message || response.statusText}`);
      }

      // Parse response
      const responseData = await response.json();
      const taskId = responseData.task_id;
      
      console.log(`[piapiDirectService] Task created successfully. ID: ${taskId}`);

      // Store task in localStorage for persistence
      this.storeTask(taskId, {
        taskId,
        status: 'pending',
        model: piapiModel,
        prompt,
        mediaType: 'video',
        params: params
      });

      return {
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error(`[piapiDirectService] Error generating video:`, error);
      throw error;
    }
  },

  /**
   * Generate audio using PiAPI
   */
  async generateAudio(
    prompt: string,
    model: PiapiAudioModel = 'diffrhythm-base',
    params: PiapiParams = {},
    videoUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      console.log(`[piapiDirectService] Generating audio with model ${model}`);
      
      if (model.includes('video2audio') && !videoUrl) {
        throw new Error('Video URL is required for video-to-audio models');
      }
      
      if (!model.includes('video2audio') && (!prompt || prompt.trim() === '')) {
        throw new Error('Prompt is required');
      }

      const apiKey = this.getApiKey();
      
      // Handle special case for ElevenLabs API
      if (model === 'elevenlabs') {
        // Direct API call to ElevenLabs endpoint
        const response = await fetch(`${PIAPI_API_BASE_URL}/audio/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'elevenlabs',
            text: prompt,
            voice: params.voice || "eleven_monolingual_v1",
            stability: params.stability || 0.5,
            similarity_boost: params.similarityBoost || 0.75
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`ElevenLabs API Error: ${errorData.error?.message || response.statusText}`);
        }
        
        const elevenlabsData = await response.json();
        const audioUrl = elevenlabsData.data?.url;
        
        if (!audioUrl) {
          throw new Error("No audio URL received from ElevenLabs API");
        }
        
        const taskId = `elevenlabs-${Date.now()}`;
        
        // Store task result
        this.storeTask(taskId, {
          taskId,
          status: 'completed',
          model: 'elevenlabs',
          prompt,
          mediaType: 'audio',
          mediaUrl: audioUrl,
          params: params
        });
        
        return {
          taskId,
          status: 'completed',
          mediaUrl: audioUrl
        };
      }
      
      // For other audio models
      let piapiModel;
      let taskType;
      let inputData: Record<string, any> = {};
      
      switch (model) {
        case 'mmaudio-video2audio':
          piapiModel = 'mmaudio/video2audio';
          taskType = 'video2audio';
          inputData = {
            "video": videoUrl,
            "prompt": prompt || "Background music"
          };
          break;
        case 'mmaudio-txt2audio':
          piapiModel = 'mmaudio/txt2audio';
          taskType = 'txt2audio';
          inputData = {
            "prompt": prompt,
            "length": params.length || "90s"
          };
          break;
        case 'diffrhythm-base':
          piapiModel = 'diffRhythm/txt2audio-base';
          taskType = 'txt2audio-base';
          inputData = {
            "prompt": prompt,
            "length": params.length || "2m"
          };
          break;
        case 'diffrhythm-full':
          piapiModel = 'diffRhythm/txt2audio-full';
          taskType = 'txt2audio-full';
          inputData = {
            "lyrics": params.lyrics || prompt,
            "style_prompt": params.stylePrompt || "Pop music",
            "length": params.length || "3m"
          };
          break;
        default:
          piapiModel = 'diffRhythm/txt2audio-base';
          taskType = 'txt2audio-base';
          inputData = {
            "prompt": prompt,
            "length": params.length || "2m"
          };
      }

      // Prepare task data
      const taskData = {
        "model": piapiModel,
        "task_type": taskType,
        "input": inputData
      };

      // Create task in PiAPI
      const response = await fetch(`${PIAPI_API_BASE_URL}/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[piapiDirectService] Error from PiAPI:`, errorData);
        throw new Error(`PiAPI Error: ${errorData.error?.message || response.statusText}`);
      }

      // Parse response
      const responseData = await response.json();
      const taskId = responseData.task_id;
      
      console.log(`[piapiDirectService] Task created successfully. ID: ${taskId}`);

      // Store task in localStorage for persistence
      this.storeTask(taskId, {
        taskId,
        status: 'pending',
        model: piapiModel,
        prompt,
        mediaType: 'audio',
        params: params
      });

      return {
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error(`[piapiDirectService] Error generating audio:`, error);
      throw error;
    }
  },

  /**
   * Check task status using PiAPI
   */
  async checkTaskStatus(taskId: string): Promise<PiapiTaskResult> {
    try {
      // Check if task is from elevenlabs (special case)
      if (taskId.startsWith('elevenlabs-')) {
        const task = this.getTask(taskId);
        if (task) {
          return {
            taskId: task.taskId,
            status: task.status as any,
            mediaUrl: task.mediaUrl,
            error: task.error
          };
        }
        throw new Error('Task not found');
      }

      console.log(`[piapiDirectService] Checking status for task ${taskId}`);
      const apiKey = this.getApiKey();
      
      const response = await fetch(`${PIAPI_API_BASE_URL}/task/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[piapiDirectService] Error response from PiAPI:`, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: 'Failed to parse error response' } };
        }
        
        throw new Error(`PiAPI Error: ${errorData.error?.message || response.statusText}`);
      }

      const taskResult = await response.json();
      
      // Map PiAPI status to our status format
      let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
      let mediaUrl: string | undefined = undefined;
      let error: string | undefined = undefined;
      
      switch (taskResult.status) {
        case 'succeeded':
          status = 'completed';
          
          // Extract media URL based on response structure
          if (taskResult.output) {
            if (Array.isArray(taskResult.output.images) && taskResult.output.images.length > 0) {
              mediaUrl = taskResult.output.images[0];
            } else if (taskResult.output.image_url) {
              mediaUrl = taskResult.output.image_url;
            } else if (taskResult.output.video_url) {
              mediaUrl = taskResult.output.video_url;
            } else if (taskResult.output.audio_url) {
              mediaUrl = taskResult.output.audio_url;
            } else if (taskResult.output.url) {
              mediaUrl = taskResult.output.url;
            } else if (typeof taskResult.output === 'string') {
              mediaUrl = taskResult.output;
            }
          }
          break;
        case 'processing':
          status = 'processing';
          break;
        case 'failed':
          status = 'failed';
          error = taskResult.error || 'Task failed without specific error message';
          break;
      }
      
      // Update task in localStorage
      this.updateTask(taskId, {
        status,
        mediaUrl,
        error
      });

      return {
        taskId,
        status,
        mediaUrl,
        error
      };
    } catch (error) {
      console.error(`[piapiDirectService] Error checking task status:`, error);
      throw error;
    }
  },

  /**
   * Cancel a task using PiAPI
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      // Skip for elevenlabs tasks (special case)
      if (taskId.startsWith('elevenlabs-')) {
        this.updateTask(taskId, {
          status: 'failed',
          error: 'Task cancelled by user'
        });
        return true;
      }
      
      console.log(`[piapiDirectService] Cancelling task ${taskId}`);
      const apiKey = this.getApiKey();
      
      const response = await fetch(`${PIAPI_API_BASE_URL}/task/${taskId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      // Handle special case where task is already completed or failed
      if (!response.ok) {
        const responseText = await response.text();
        const isAlreadyCompleted = responseText.includes("already completed") || 
                                responseText.includes("already failed");
        
        if (isAlreadyCompleted) {
          console.log(`[piapiDirectService] Task is already completed or failed`);
          return true;
        }
        
        throw new Error(`Failed to cancel task: ${responseText}`);
      }

      // Update task in localStorage
      this.updateTask(taskId, {
        status: 'failed',
        error: 'Task cancelled by user'
      });

      return true;
    } catch (error) {
      console.error(`[piapiDirectService] Error cancelling task:`, error);
      return false;
    }
  },

  /**
   * Store task info in localStorage for persistence
   */
  storeTask(taskId: string, taskInfo: StoredTaskInfo): void {
    try {
      const tasks = this.getTasks();
      tasks[taskId] = { 
        ...taskInfo,
        createdAt: new Date().toISOString() 
      };
      localStorage.setItem('piapi_tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error(`[piapiDirectService] Error storing task:`, error);
    }
  },

  /**
   * Update task info in localStorage
   */
  updateTask(taskId: string, updates: Partial<StoredTaskInfo>): void {
    try {
      const tasks = this.getTasks();
      if (tasks[taskId]) {
        tasks[taskId] = { 
          ...tasks[taskId], 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('piapi_tasks', JSON.stringify(tasks));
      }
    } catch (error) {
      console.error(`[piapiDirectService] Error updating task:`, error);
    }
  },

  /**
   * Get task info from localStorage
   */
  getTask(taskId: string): StoredTaskInfo | null {
    try {
      const tasks = this.getTasks();
      return tasks[taskId] || null;
    } catch (error) {
      console.error(`[piapiDirectService] Error getting task:`, error);
      return null;
    }
  },

  /**
   * Get all tasks from localStorage
   */
  getTasks(): Record<string, StoredTaskInfo> {
    try {
      const tasksJson = localStorage.getItem('piapi_tasks');
      return tasksJson ? JSON.parse(tasksJson) : {};
    } catch (error) {
      console.error(`[piapiDirectService] Error getting tasks:`, error);
      return {};
    }
  },

  /**
   * Clean up old tasks from localStorage
   */
  cleanupOldTasks(olderThanDays: number = 7): void {
    try {
      const tasks = this.getTasks();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let tasksRemoved = 0;
      
      for (const [taskId, task] of Object.entries(tasks)) {
        if (task && typeof task === 'object' && 'createdAt' in task) {
          const createdAtString = task.createdAt as string || new Date().toISOString();
          const createdAt = new Date(createdAtString);
          
          if (createdAt < cutoffDate) {
            delete tasks[taskId];
            tasksRemoved++;
          }
        }
      }
      
      localStorage.setItem('piapi_tasks', JSON.stringify(tasks));
      
      if (tasksRemoved > 0) {
        console.log(`[piapiDirectService] Cleaned up ${tasksRemoved} old tasks`);
      }
    } catch (error) {
      console.error(`[piapiDirectService] Error cleaning up old tasks:`, error);
    }
  }
};

// Export PiAPI service types and service
export default piapiDirectService;
