
/**
 * Interface for media upload results
 */
export interface MediaUploadResult {
  url: string;
  type: string;
  filename?: string;
  metadata?: Record<string, any>;
}
