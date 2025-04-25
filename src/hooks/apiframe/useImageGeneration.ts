
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams } from '@/types/apiframeGeneration';

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
    return apiframeGeneration.generateMedia(prompt, 'image', model, params);
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
