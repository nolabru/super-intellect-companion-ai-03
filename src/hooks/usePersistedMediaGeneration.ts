
import { useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import { useMediaPersistence } from '@/hooks/useMediaPersistence';
import { useMediaCache, CachedMedia } from '@/hooks/useMediaCache';
import { Task as TaskManagerTask } from '@/hooks/useTaskManager';
import { Task as ApiframeTask } from '@/hooks/apiframe/useTaskState';
import { useMediaTelemetry } from '@/hooks/useMediaTelemetry';

interface PersistedMediaGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (mediaUrl: string, taskId: string) => void;
  onError?: (error: string) => void;
  useCaching?: boolean;
  skipCacheForModels?: string[];
  useTelemetry?: boolean;
}

/**
 * Hook that combines unified media generation with persistence and caching
 */
export function usePersistedMediaGeneration(options: PersistedMediaGenerationOptions = {}) {
  const {
    showToasts = true,
    onProgress,
    onComplete,
    onError,
    useCaching = true,
    skipCacheForModels = [],
    useTelemetry = true
  } = options;
  
  const [persistedTaskId, setPersistedTaskId] = useState<string | null>(null);
  const [usedCachedMedia, setUsedCachedMedia] = useState<boolean>(false);
  
  // Add telemetry
  const { 
    trackGeneration, 
    trackCacheEvent, 
    startMeasurement 
  } = useMediaTelemetry({
    enabled: useTelemetry
  });
  
  const {
    persistTask,
    updatePersistedTask,
    updateTaskFromStatus,
    getCurrentTask
  } = useMediaPersistence();
  
  // Use the media cache hook
  const {
    findCachedMedia,
    cacheMedia,
    isInitialized: isCacheInitialized
  } = useMediaCache({
    maxItems: 100,
    expireAfterDays: 7
  });
  
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
      
      // Track generation completion
      if (useTelemetry && currentTask) {
        trackGeneration(
          'complete',
          currentTask.type as any,
          currentTask.model,
          currentTask.id,
          { mediaUrl },
          currentTask.metadata?.generationTime
        );
      }
      
      // Cache the media if it's not from cache already
      if (useCaching && currentTask && !usedCachedMedia) {
        cacheMedia(
          mediaUrl,
          currentTask.type as 'image' | 'video' | 'audio',
          currentTask.prompt,
          currentTask.model,
          currentTask.metadata
        );
      }
      
      if (onComplete) {
        onComplete(mediaUrl, persistedTaskId || '');
      }
      
      setUsedCachedMedia(false);
    },
    onError: (error) => {
      if (persistedTaskId) {
        updatePersistedTask(persistedTaskId, { 
          status: 'failed',
          error
        });
      }
      
      // Track generation error
      if (useTelemetry && currentTask) {
        trackGeneration(
          'error',
          currentTask.type as any,
          currentTask.model,
          currentTask.id,
          { error }
        );
      }
      
      if (onError) {
        onError(error);
      }
      
      setUsedCachedMedia(false);
    }
  });
  
  // Wrapper for generate media that also persists the task and checks cache
  const generateMedia = useCallback((
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: any = {},
    referenceUrl?: string
  ) => {
    // Start measuring generation time
    const endMeasurement = useTelemetry ? startMeasurement('media_generation') : null;
    
    // Check cache first if enabled
    if (useCaching && isCacheInitialized && !skipCacheForModels.includes(model)) {
      const cachedMedia = findCachedMedia(prompt, model, params);
      
      if (cachedMedia && cachedMedia.url) {
        console.log(`[usePersistedMediaGeneration] Using cached media:`, cachedMedia);
        
        // Track cache hit
        if (useTelemetry) {
          trackCacheEvent('hit', type, model, prompt);
        }
        
        // Create a persisted task for the cached media
        const taskId = uuidv4(); // Generate a fake task ID
        
        const id = persistTask(
          type,
          prompt,
          model,
          taskId,
          params,
          referenceUrl
        );
        
        setPersistedTaskId(id);
        setUsedCachedMedia(true);
        
        // Update the task to completed immediately
        updatePersistedTask(id, {
          status: 'completed',
          mediaUrl: cachedMedia.url,
          progress: 100
        });
        
        if (onProgress) {
          onProgress(100);
        }
        
        if (onComplete) {
          onComplete(cachedMedia.url, id);
        }
        
        // Finish measuring
        if (endMeasurement) {
          endMeasurement({ cacheHit: true, type, model });
        }
        
        return id;
      } else if (useTelemetry) {
        // Track cache miss
        trackCacheEvent('miss', type, model, prompt);
      }
    }
    
    // Track generation start
    if (useTelemetry) {
      trackGeneration('start', type, model, '', { prompt, params, referenceUrl });
    }
    
    // Generate the media with the base hook if no cache hit
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
    
    // Add generation time tracking
    if (currentTask) {
      currentTask.metadata = {
        ...currentTask.metadata,
        generationStartTime: Date.now()
      };
    }
    
    return id;
  }, [
    generateMediaBase, 
    persistTask, 
    useCaching, 
    findCachedMedia, 
    isCacheInitialized, 
    skipCacheForModels, 
    onProgress, 
    onComplete, 
    trackGeneration,
    trackCacheEvent,
    startMeasurement,
    useTelemetry,
    currentTask
  ]);
  
  // Update persisted task when currentTask changes
  useEffect(() => {
    if (persistedTaskId && currentTask && !usedCachedMedia) {
      // Calculate generation time if completed
      if (currentTask.status === 'completed' && 
          currentTask.metadata?.generationStartTime && 
          !currentTask.metadata?.generationTime) {
        currentTask.metadata.generationTime = Date.now() - currentTask.metadata.generationStartTime;
      }
      
      // Map the TaskManager Task to the format expected by updateTaskFromStatus
      const apiframeTaskFormat: Partial<ApiframeTask> = {
        taskId: currentTask.id, // Use id from TaskManager as taskId
        status: mapTaskStatus(currentTask.status), // Map the status to compatible format
        progress: currentTask.progress || 0,
        mediaUrl: currentTask.result, // Map result to mediaUrl
        error: currentTask.error
      };
      
      updateTaskFromStatus(persistedTaskId, apiframeTaskFormat as ApiframeTask);
    }
  }, [currentTask, persistedTaskId, usedCachedMedia, updateTaskFromStatus]);
  
  // Helper function to map TaskManager status to ApiframeTask status
  function mapTaskStatus(status: TaskManagerTask['status']): ApiframeTask['status'] {
    // Convert "canceled" to "failed" since ApiframeTask doesn't have "canceled"
    if (status === 'canceled') {
      return 'failed';
    }
    return status;
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
    usedCachedMedia,
  };
}
