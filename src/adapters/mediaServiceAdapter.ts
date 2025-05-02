
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

export default createMediaAdapter;
