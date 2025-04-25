
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeAudioModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';

/**
 * Hook for audio generation using APIframe.ai
 */
export function useAudioGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateAudio = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    referenceUrl?: string
  ) => {
    // Convert string model to ApiframeAudioModel
    const apiframeModel = getApiframeModelId(model) as ApiframeAudioModel;
    return apiframeGeneration.generateMedia(prompt, 'audio', apiframeModel, params, referenceUrl);
  }, [apiframeGeneration]);

  return {
    generateAudio,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
