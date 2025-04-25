
export type ApiframeMediaType = 'image' | 'video' | 'audio';

export type ApiframeModel = string;

export interface ApiframeParams {
  [key: string]: any;
}

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
