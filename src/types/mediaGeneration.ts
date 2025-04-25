
import { PiapiMediaType, PiapiModel, PiapiParams } from '@/services/piapiDirectService';
import { MediaGenerationResult } from '@/services/mediaService';

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

