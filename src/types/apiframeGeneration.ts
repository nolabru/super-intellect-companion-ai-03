
export type ApiframeMediaType = 'image' | 'video' | 'audio';

// Image Models
export type ApiframeImageModel = 
  | 'sdxl' 
  | 'kandinsky' 
  | 'deepfloyd'
  | 'dalle'
  | 'sdxl-turbo';

// Video Models
export type ApiframeVideoModel = 
  | 'kling-text'
  | 'kling-image'
  | 'hunyuan-fast'
  | 'hunyuan-standard'
  | 'hailuo-text'
  | 'hailuo-image';

// Audio Models
export type ApiframeAudioModel = 
  | 'elevenlabs-v2'
  | 'openai-tts-1'
  | 'coqui-xtts';

export type ApiframeModel = 
  | ApiframeImageModel 
  | ApiframeVideoModel 
  | ApiframeAudioModel;

// Base parameters interface
export interface ApiframeBaseParams {
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

// Image-specific parameters
export interface ApiframeImageParams extends ApiframeBaseParams {
  width?: number;
  height?: number;
  seed?: number;
  style_preset?: string;
  quality?: 'standard' | 'hd';
}

// Video-specific parameters
export interface ApiframeVideoParams extends ApiframeBaseParams {
  duration?: number;
  fps?: number;
  motion_bucket_id?: number;
  reference_image_url?: string;
}

// Audio-specific parameters
export interface ApiframeAudioParams {
  voice_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  speaking_rate?: number;
}

export type ApiframeParams = 
  | ApiframeImageParams 
  | ApiframeVideoParams 
  | ApiframeAudioParams;

export interface GenerationTask {
  taskId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

export interface MediaGenerationResult {
  success: boolean;
  taskId?: string;
  status?: string;
  mediaUrl?: string;
  error?: string;
}

export interface UseMediaGenerationOptions {
  userId?: string;
  shouldCheckTokens?: boolean;
  shouldTrackProgress?: boolean;
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (result: MediaGenerationResult) => void;
}

