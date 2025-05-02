
import { useState } from 'react';
import { useMediaGeneration } from './useMediaGeneration';

export function usePersistedMediaGeneration() {
  const mediaGeneration = useMediaGeneration();
  const [mediaHistory, setMediaHistory] = useState<any[]>([]);
  
  const generateAndPersist = async (prompt: string, type: 'image' | 'video' | 'audio') => {
    const result = await mediaGeneration.generateMedia(prompt, type);
    
    if (result) {
      // Add to history
      setMediaHistory(prev => [...prev, result]);
      return result;
    }
    
    return null;
  };
  
  return {
    ...mediaGeneration,
    mediaHistory,
    generateAndPersist
  };
}
