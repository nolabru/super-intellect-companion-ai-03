
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
    console.log(`[useImageGeneration] Generating image with model ${model}`);
    
    // Convert string model to ApiframeImageModel
    const apiframeModel = getApiframeModelId(model) as ApiframeImageModel;
    
    return apiframeGeneration.generateMedia(prompt, 'image', apiframeModel, params);
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
