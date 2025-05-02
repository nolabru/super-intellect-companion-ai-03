
export interface MediaGenerationResult {
  success: boolean;
  mediaUrl?: string;
  taskId?: string;
  error?: string;
}

export interface MediaGenerationParams {
  negativePrompt?: string;
  width?: number;
  height?: number;
  guidanceScale?: number;
  aspectRatio?: string;
  duration?: number;
  quality?: string;
  style?: string;
  [key: string]: any;
}

export interface MediaGenerationTask {
  taskId: string;
  type: 'image' | 'video' | 'audio';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  prompt: string;
  model: string;
  progress: number;
  mediaUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaServiceOptions {
  showToasts: boolean;
  onTaskUpdate?: (task: MediaGenerationTask) => void;
}
