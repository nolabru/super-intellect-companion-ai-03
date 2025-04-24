
import { toast } from 'sonner';

// Types
export type PiapiMediaType = 'image' | 'video' | 'audio';

export type PiapiImageModel = 
  'flux-dev' | 
  'flux-schnell' | 
  'dall-e-3' | 
  'sdxl';

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

const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

export class PiapiDirectService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, data: any): Promise<Response> {
    return fetch(`${PIAPI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  private validateImageParams(params: PiapiParams = {}): void {
    if (params.width && (params.width < 256 || params.width > 1024)) {
      throw new Error("Width must be between 256 and 1024 pixels");
    }
    if (params.height && (params.height < 256 || params.height > 1024)) {
      throw new Error("Height must be between 256 and 1024 pixels");
    }
  }

  async generateImage(
    prompt: string,
    model: PiapiImageModel = 'flux-schnell',
    params: PiapiParams = {}
  ): Promise<PiapiTaskResult> {
    try {
      console.log('[PiapiDirectService] Starting image generation:', {
        prompt,
        model,
        params
      });

      this.validateImageParams(params);

      const taskData = {
        model: model,
        task_type: "txt2img",
        input: {
          prompt,
          negative_prompt: params.negativePrompt || "",
          guidance_scale: params.guidanceScale || 7.5,
          width: params.width || 768,
          height: params.height || 768
        }
      };

      const response = await this.makeRequest('/task', taskData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }

      const data = await response.json();
      return {
        taskId: data.task_id,
        status: 'pending'
      };
    } catch (error) {
      console.error('[PiapiDirectService] Error generating image:', error);
      throw error;
    }
  }

  async generateVideo(
    prompt: string,
    model: PiapiVideoModel = 'kling-text',
    params: PiapiParams = {},
    imageUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      console.log('[PiapiDirectService] Starting video generation:', {
        prompt,
        model,
        params,
        imageUrl
      });

      let taskData: any = {
        model,
        task_type: model.includes('image') ? 'img2video' : 'txt2video',
        input: {
          prompt
        }
      };

      if (model.includes('image')) {
        if (!imageUrl) {
          throw new Error(`Model ${model} requires a reference image URL`);
        }
        taskData.input.image = imageUrl;
      }

      // Add optional parameters
      if (params.fps) taskData.input.fps = params.fps;
      if (params.duration) taskData.input.duration = params.duration;
      if (params.resolution) taskData.input.resolution = params.resolution;

      const response = await this.makeRequest('/task', taskData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }

      const data = await response.json();
      return {
        taskId: data.task_id,
        status: 'pending'
      };
    } catch (error) {
      console.error('[PiapiDirectService] Error generating video:', error);
      throw error;
    }
  }

  async generateAudio(
    prompt: string,
    model: PiapiAudioModel = 'diffrhythm-base',
    params: PiapiParams = {},
    videoUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      console.log('[PiapiDirectService] Starting audio generation:', {
        prompt,
        model,
        params,
        videoUrl
      });

      let taskData: any = {
        model,
        input: {}
      };

      switch (model) {
        case 'mmaudio-video2audio':
          if (!videoUrl) {
            throw new Error('Video URL is required for video to audio conversion');
          }
          taskData.task_type = 'video2audio';
          taskData.input = {
            video: videoUrl,
            prompt: prompt || 'Background music'
          };
          break;

        case 'mmaudio-txt2audio':
          taskData.task_type = 'txt2audio';
          taskData.input = {
            prompt,
            length: params.length || '90s'
          };
          break;

        case 'diffrhythm-base':
          taskData.task_type = 'txt2audio-base';
          taskData.input = {
            prompt,
            length: params.length || '2m'
          };
          break;

        case 'diffrhythm-full':
          taskData.task_type = 'txt2audio-full';
          taskData.input = {
            lyrics: params.lyrics || prompt,
            style_prompt: params.stylePrompt || 'Pop music',
            length: params.length || '3m'
          };
          break;

        case 'elevenlabs':
          // Direct endpoint for ElevenLabs
          const elevenLabsResponse = await fetch(`${PIAPI_BASE_URL}/audio/generate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'elevenlabs',
              text: prompt,
              voice: params.voice || 'eleven_monolingual_v1',
              stability: params.stability || 0.5,
              similarity_boost: params.similarityBoost || 0.75
            })
          });

          if (!elevenLabsResponse.ok) {
            const errorData = await elevenLabsResponse.json();
            throw new Error(errorData.error?.message || elevenLabsResponse.statusText);
          }

          const elevenLabsData = await elevenLabsResponse.json();
          return {
            taskId: crypto.randomUUID(),
            status: 'completed',
            mediaUrl: elevenLabsData.data?.url
          };

        default:
          throw new Error(`Unsupported audio model: ${model}`);
      }

      const response = await this.makeRequest('/task', taskData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }

      const data = await response.json();
      return {
        taskId: data.task_id,
        status: 'pending'
      };
    } catch (error) {
      console.error('[PiapiDirectService] Error generating audio:', error);
      throw error;
    }
  }

  async checkTaskStatus(taskId: string): Promise<PiapiTaskResult> {
    try {
      console.log(`[PiapiDirectService] Checking status for task: ${taskId}`);

      const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }

      const data = await response.json();
      
      let status: PiapiTaskResult['status'] = 'pending';
      let mediaUrl: string | undefined;
      let error: string | undefined;

      switch (data.status) {
        case 'succeeded':
          status = 'completed';
          if (data.output) {
            if (Array.isArray(data.output.images) && data.output.images.length > 0) {
              mediaUrl = data.output.images[0];
            } else if (data.output.image_url) {
              mediaUrl = data.output.image_url;
            } else if (data.output.video_url) {
              mediaUrl = data.output.video_url;
            } else if (data.output.audio_url) {
              mediaUrl = data.output.audio_url;
            } else if (data.output.url) {
              mediaUrl = data.output.url;
            } else if (typeof data.output === 'string') {
              mediaUrl = data.output;
            }
          }
          break;
        case 'processing':
          status = 'processing';
          break;
        case 'failed':
          status = 'failed';
          error = data.error || 'Task failed without specific error message';
          break;
        default:
          status = 'pending';
      }

      return {
        taskId,
        status,
        mediaUrl,
        error
      };
    } catch (error) {
      console.error('[PiapiDirectService] Error checking task status:', error);
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[PiapiDirectService] Cancelling task: ${taskId}`);

      const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      // Check if task is already completed or failed
      const responseText = await response.text();
      const isAlreadyCompleted = responseText.includes("already completed") || 
                                responseText.includes("already failed");

      return response.ok || isAlreadyCompleted;
    } catch (error) {
      console.error('[PiapiDirectService] Error cancelling task:', error);
      return false;
    }
  }
}

// Create and export singleton instance
let piapiDirectService: PiapiDirectService | null = null;

export const initializePiapiService = (apiKey: string) => {
  piapiDirectService = new PiapiDirectService(apiKey);
  return piapiDirectService;
};

export const getPiapiService = () => {
  if (!piapiDirectService) {
    throw new Error('PIAPI service not initialized. Call initializePiapiService first.');
  }
  return piapiDirectService;
};
