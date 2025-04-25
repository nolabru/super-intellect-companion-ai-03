
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeVideoModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';

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
    // Convert string model to ApiframeVideoModel
    const apiframeModel = getApiframeModelId(model) as ApiframeVideoModel;
    return apiframeGeneration.generateMedia(prompt, 'video', apiframeModel, params, referenceImageUrl);
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
