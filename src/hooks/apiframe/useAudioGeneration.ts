
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams } from '@/types/apiframeGeneration';

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
    return apiframeGeneration.generateMedia(prompt, 'audio', model, params, referenceUrl);
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
