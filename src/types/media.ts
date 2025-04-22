
/**
 * Interface for media upload results
 */
export interface MediaUploadResult {
  url: string;
  type: string;
  filename?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface para resposta da PiAPI
 */
export interface PiApiResponse {
  taskId?: string;
  status: string;
  mediaUrl?: string;
  mediaType?: string;
  message?: string;
  error?: string;
}

/**
 * Interface para parâmetros da PiAPI
 */
export interface PiApiParams {
  negativePrompt?: string;
  guidanceScale?: number;
  width?: number;
  height?: number;
  duration?: number;
  aspectRatio?: string;
  length?: string;
  voice?: string;
  stability?: number;
  similarityBoost?: number;
  lyrics?: string;
  stylePrompt?: string;
  [key: string]: any;
}
