
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeImageModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';

/**
 * Custom hook for image generation with APIframe.ai
 * Includes retry and fallback mechanisms
 */
export function useImageGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateImage = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    options: {
      maxRetries?: number;
      useFallback?: boolean;
      fallbackModel?: string;
    } = {}
  ) => {
    console.log(`[useImageGeneration] Generating image with model ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    const {
      maxRetries = 3,
      useFallback = true,
      fallbackModel = 'sdxl' // Default fallback model
    } = options;
    
    // Track retry attempts
    let attempts = 0;
    let lastError = null;
    
    // Retry logic with exponential backoff
    const retryDelay = (attempt: number): number => Math.min(1000 * Math.pow(2, attempt), 10000);
    
    while (attempts < maxRetries) {
      try {
        // Show retry notification after first attempt
        if (attempts > 0) {
          toast.info(`Retrying image generation (${attempts}/${maxRetries})`, {
            id: `retry-image-${attempts}`,
            duration: 2000
          });
        }
        
        // Convert string model to ApiframeImageModel
        const apiframeModel = getApiframeModelId(model) as ApiframeImageModel;
        console.log(`[useImageGeneration] Using model: ${apiframeModel}`);
        
        // Generate the image
        const result = await apiframeGeneration.generateMedia(
          prompt, 
          'image', 
          apiframeModel, 
          params
        );
        
        // Return successful result
        return result;
      } catch (error) {
        console.error(`[useImageGeneration] Attempt ${attempts + 1} failed:`, error);
        lastError = error;
        
        // Don't retry for certain errors
        if (
          error.message?.includes('token') || 
          error.message?.includes('API key') || 
          error.message?.includes('Insufficient') ||
          error.message?.includes('Authentication')
        ) {
          break;
        }
        
        // Wait before next retry
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay(attempts)));
        }
      }
    }
    
    // All retries failed, try fallback model if enabled
    if (useFallback && model !== fallbackModel) {
      try {
        console.log(`[useImageGeneration] All retries failed. Trying fallback model: ${fallbackModel}`);
        toast.warning(`Using fallback model: ${fallbackModel}`, {
          duration: 3000
        });
        
        // Convert fallback model string to ApiframeImageModel
        const fallbackApiframeModel = getApiframeModelId(fallbackModel) as ApiframeImageModel;
        
        // Attempt with fallback model
        const result = await apiframeGeneration.generateMedia(
          prompt, 
          'image', 
          fallbackApiframeModel, 
          params
        );
        
        return result;
      } catch (fallbackError) {
        console.error('[useImageGeneration] Fallback model failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    // All attempts including fallback failed
    console.error('[useImageGeneration] All generation attempts failed');
    throw lastError;
  }, [apiframeGeneration]);

  return {
    generateImage,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
