
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams } from '@/types/apiframeGeneration';

/**
 * Hook for video generation using APIframe.ai
 */
export function useVideoGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateVideo = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    referenceImageUrl?: string
  ) => {
    return apiframeGeneration.generateMedia(prompt, 'video', model, params, referenceImageUrl);
  }, [apiframeGeneration]);

  return {
    generateVideo,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
