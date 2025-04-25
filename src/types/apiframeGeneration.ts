
/**
 * APIframe.ai media generation types
 */

export type ApiframeMediaType = 'image' | 'video' | 'audio';

export type ApiframeModel = string;

export interface ApiframeParams {
  [key: string]: any;
}

export interface UseMediaGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (result: MediaGenerationResult) => void;
  autoSaveToGallery?: boolean;
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
