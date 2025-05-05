
export interface UseMediaGenerationOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: { success: true; mediaUrl: string; taskId: string }) => void;
  showToasts?: boolean;
}

export type ApiframeMediaType = 'image' | 'video' | 'audio';
export type ApiframeImageModel = 'stability-sd-xl' | 'openai-dalle-3' | 'midjourney' | 'V_1' | 'V_2' | 'V_1_TURBO' | 'V_2_TURBO';
export type ApiframeVideoModel = 'runway-gen2' | 'pika-1' | 'luma-3d';
export type ApiframeAudioModel = 'eleven-labs' | 'openai-tts' | 'music-gen';
export type ApiframeModel = ApiframeImageModel | ApiframeVideoModel | ApiframeAudioModel;

// OpenRouter models
export type OpenRouterModel = string;

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

// Add Ideogram specific params
export interface IdeogramParams extends ApiframeParams {
  style_type?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  resolution?: string;
  magic_prompt_option?: 'AUTO' | 'ON' | 'OFF';
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

// Updated MediaGenerationResult interface with consistent error property
export interface MediaGenerationResult {
  success: boolean;
  mediaUrl?: string;
  taskId?: string;
  error?: string;
  status?: string;
}

// OpenRouter specific types
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterChatParams {
  model: OpenRouterModel;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenRouterChatResult {
  success: boolean;
  text?: string;
  error?: string;
}
