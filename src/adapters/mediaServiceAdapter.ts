
import { useApiframeGeneration } from '@/hooks/useApiframeGeneration';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';

type MediaType = 'image' | 'video' | 'audio';

// This adapter provides a unified interface for different media generation services
const createMediaAdapter = () => {
  // Use hooks to access the individual services
  const apiframeHook = useApiframeGeneration();
  const mediaHook = useMediaGeneration();
  
  const generateMedia = async (prompt: string, type: MediaType) => {
    // Choose which service to use based on type or other criteria
    if (type === 'image') {
      return await apiframeHook.generateMedia(prompt, type);
    } else {
      return await mediaHook.generateMedia(prompt, type);
    }
  };
  
  return {
    generateMedia,
    isGenerating: apiframeHook.generating || mediaHook.generating,
    error: apiframeHook.error || mediaHook.error
  };
};

// Export both the factory function and a hook version
export default createMediaAdapter;

// Create hook version for components that need it
export const useMediaServiceAdapter = (provider = 'piapi', options = {}) => {
  // Return a preconfigured adapter based on provider
  return {
    generateMedia: async (type: 'image' | 'video' | 'audio', prompt: string, model: string, params = {}, referenceUrl?: string) => {
      console.log(`Generating ${type} with ${provider}: ${prompt}`);
      // Simplified mock implementation
      return {
        success: true,
        taskId: 'mock-task-id',
        mediaUrl: `https://example.com/mock-${type}.jpg`
      };
    },
    cancelGeneration: async () => {
      return true;
    },
    isGenerating: false,
    error: null
  };
};
