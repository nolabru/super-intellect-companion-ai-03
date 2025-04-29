
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
    referenceUrl?: string
  ) => {
    console.log(`[useVideoGeneration] Generating video with model ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    try {
      // Convert string model to ApiframeVideoModel
      const apiframeModel = getApiframeModelId(model) as ApiframeVideoModel;
      console.log(`[useVideoGeneration] Mapped model ID: ${apiframeModel}`);
      
      // Use the refactored generateMedia method
      const result = await apiframeGeneration.generateMedia(
        prompt, 
        'video', 
        apiframeModel, 
        params, 
        referenceUrl
      );
      
      console.log('[useVideoGeneration] Generation result:', result);
      return result;
    } catch (error) {
      console.error('[useVideoGeneration] Error generating video:', error);
      throw error;
    }
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
