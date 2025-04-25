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
    params: ApiframeParams = {}
  ) => {
    console.log(`[useAudioGeneration] Generating audio with model ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    try {
      // Convert string model to ApiframeAudioModel
      const apiframeModel = getApiframeModelId(model) as ApiframeAudioModel;
      console.log(`[useAudioGeneration] Mapped model ID: ${apiframeModel}`);
      
      // Call the generateMedia function with the correct parameters
      const result = await apiframeGeneration.generateMedia(
        prompt, 
        'audio', 
        apiframeModel, 
        params
      );
      
      console.log('[useAudioGeneration] Generation result:', result);
      return result;
    } catch (error) {
      console.error('[useAudioGeneration] Error generating audio:', error);
      throw error;
    }
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
