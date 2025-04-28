
export interface UseMediaGenerationOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: { success: true; mediaUrl: string; taskId: string }) => void;
  showToasts?: boolean;
}

export type ApiframeMediaType = 'image' | 'video' | 'audio';
export type ApiframeImageModel = 'stability-sd-xl' | 'openai-dalle-3' | 'midjourney';
export type ApiframeVideoModel = 'runway-gen2' | 'pika-1' | 'luma-3d';
export type ApiframeAudioModel = 'eleven-labs' | 'openai-tts' | 'music-gen';
export type ApiframeModel = ApiframeImageModel | ApiframeVideoModel | ApiframeAudioModel;

export interface ApiframeParams {
  width?: number;
  height?: number;
  duration?: number;
  negativePrompt?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
  [key: string]: any;
}

// Add specific type interfaces for different media types
export interface ApiframeVideoParams extends ApiframeParams {
  aspectRatio?: string;
  fps?: number;
}

export interface ApiframeAudioParams extends ApiframeParams {
  voice_id?: string;
  voice?: string;
  stability?: number;
  similarity_boost?: number;
  speed?: number;
  language?: string;
}

// Add MediaGenerationResult interface with status property
export interface MediaGenerationResult {
  success: boolean;
  mediaUrl?: string;
  taskId?: string;
  error?: string;
  status?: string;
}
