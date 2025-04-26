
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeAudioModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';

/**
 * Hook for audio generation with streaming support using APIframe.ai
 */
export function useAudioStreamGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateAudioStream = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    onStreamUpdate?: (url: string) => void
  ) => {
    console.log(`[useAudioStreamGeneration] Generating audio stream with model ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    try {
      // Convert string model to ApiframeAudioModel
      const apiframeModel = getApiframeModelId(model) as ApiframeAudioModel;
      console.log(`[useAudioStreamGeneration] Mapped model ID: ${apiframeModel}`);
      
      // Pass a callback function to handle streaming updates
      const enhancedParams = {
        ...params,
        stream: true,
        onStreamUpdate: (url: string) => {
          console.log('[useAudioStreamGeneration] Received stream update');
          if (onStreamUpdate) {
            onStreamUpdate(url);
          }
        }
      };
      
      // Call the generateMedia function with the correct parameters
      const result = await apiframeGeneration.generateMedia(
        prompt, 
        'audio', 
        apiframeModel, 
        enhancedParams
      );
      
      console.log('[useAudioStreamGeneration] Generation result:', result);
      return result;
    } catch (error) {
      console.error('[useAudioStreamGeneration] Error generating audio stream:', error);
      throw error;
    }
  }, [apiframeGeneration]);

  return {
    generateAudioStream,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
