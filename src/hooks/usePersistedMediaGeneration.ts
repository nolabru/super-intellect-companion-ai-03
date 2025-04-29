
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import { useMediaPersistence } from '@/hooks/useMediaPersistence';

interface PersistedMediaGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (mediaUrl: string, taskId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook that combines unified media generation with persistence
 */
export function usePersistedMediaGeneration(options: PersistedMediaGenerationOptions = {}) {
  const {
    showToasts = true,
    onProgress,
    onComplete,
    onError
  } = options;
  
  const [persistedTaskId, setPersistedTaskId] = useState<string | null>(null);
  
  const {
    persistTask,
    updatePersistedTask,
    updateTaskFromStatus,
    getCurrentTask
  } = useMediaPersistence();
  
  // Use the unified media generation hook
  const {
    generateMedia: generateMediaBase,
    cancelGeneration,
    isGenerating,
    currentTask,
    generatedMedia
  } = useUnifiedMediaGeneration({
    showToasts,
    onProgress: (progress) => {
      if (persistedTaskId) {
        updatePersistedTask(persistedTaskId, { progress });
      }
      
      if (onProgress) {
        onProgress(progress);
      }
    },
    onComplete: (mediaUrl) => {
      if (persistedTaskId) {
        updatePersistedTask(persistedTaskId, { 
          status: 'completed',
          mediaUrl,
          progress: 100
        });
      }
      
      if (onComplete) {
        onComplete(mediaUrl, persistedTaskId || '');
      }
    },
    onError: (error) => {
      if (persistedTaskId) {
        updatePersistedTask(persistedTaskId, { 
          status: 'failed',
          error
        });
      }
      
      if (onError) {
        onError(error);
      }
    }
  });
  
  // Wrapper for generate media that also persists the task
  const generateMedia = useCallback((
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: any = {},
    referenceUrl?: string
  ) => {
    // Generate the media with the base hook
    const taskId = generateMediaBase(
      type,
      prompt,
      model,
      params,
      referenceUrl
    );
    
    // Persist the task
    const id = persistTask(
      type,
      prompt,
      model,
      taskId,
      params,
      referenceUrl
    );
    
    setPersistedTaskId(id);
    
    return id;
  }, [generateMediaBase, persistTask]);
  
  // Update persisted task when currentTask changes
  if (persistedTaskId && currentTask) {
    updateTaskFromStatus(persistedTaskId, currentTask);
  }
  
  return {
    generateMedia,
    generateImage: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('image', prompt, model, params, referenceUrl),
    generateVideo: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('video', prompt, model, params, referenceUrl),
    generateAudio: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('audio', prompt, model, params, referenceUrl),
    cancelGeneration,
    isGenerating,
    currentTask,
    persistedTask: persistedTaskId ? getCurrentTask() : null,
    generatedMedia,
  };
}
