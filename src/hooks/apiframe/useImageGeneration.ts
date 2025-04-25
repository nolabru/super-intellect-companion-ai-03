
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeImageModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';

/**
 * Hook for image generation using APIframe.ai
 */
export function useImageGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateImage = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {}
  ) => {
    console.log(`[useImageGeneration] Generating image with model ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    try {
      // Convert string model to ApiframeImageModel
      const apiframeModel = getApiframeModelId(model) as ApiframeImageModel;
      console.log(`[useImageGeneration] Mapped model ID: ${apiframeModel}`);
      
      const result = await apiframeGeneration.generateMedia(prompt, 'image', apiframeModel, params);
      console.log('[useImageGeneration] Generation result:', result);
      return result;
    } catch (error) {
      console.error('[useImageGeneration] Error generating image:', error);
      throw error;
    }
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
