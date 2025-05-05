
import { useEffect, useRef } from 'react';

interface UseMediaGenerationOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (mediaUrl: string) => void;
  onError?: (error: string) => void;
}

export function useTaskCleanup(options: UseMediaGenerationOptions = {}) {
  const abortControllers = useRef<Record<string, AbortController>>({});
  const statusCheckIntervals = useRef<Record<string, number>>({});
  const taskStartTimes = useRef<Record<string, number>>({});

  // Method to register a task for tracking
  const registerTask = (taskId: string, mediaType: 'image') => {
    // Record the start time
    taskStartTimes.current[taskId] = Date.now();
    
    // Track the start event in console
    console.log(`Task ${taskId} started for ${mediaType} generation`);
    
    // Return the abort controller for this task
    abortControllers.current[taskId] = new AbortController();
    return abortControllers.current[taskId];
  };

  // Method to track generation completed
  const completeTask = (taskId: string, mediaType: 'image', modelId?: string, mediaUrl?: string) => {
    const startTime = taskStartTimes.current[taskId];
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Track completion in console
    console.log(`Task ${taskId} completed in ${duration}ms for ${mediaType}`, { mediaUrl });
    
    // Clean up
    delete taskStartTimes.current[taskId];
    if (abortControllers.current[taskId]) {
      delete abortControllers.current[taskId];
    }
    if (statusCheckIntervals.current[taskId]) {
      clearInterval(statusCheckIntervals.current[taskId]);
      delete statusCheckIntervals.current[taskId];
    }
  };

  // Method to track generation failed
  const failTask = (taskId: string, mediaType: 'image', modelId?: string, error?: string) => {
    const startTime = taskStartTimes.current[taskId];
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Track failure in console
    console.log(`Task ${taskId} failed after ${duration}ms for ${mediaType}`, { error });
    
    // Clean up
    delete taskStartTimes.current[taskId];
    if (abortControllers.current[taskId]) {
      delete abortControllers.current[taskId];
    }
    if (statusCheckIntervals.current[taskId]) {
      clearInterval(statusCheckIntervals.current[taskId]);
      delete statusCheckIntervals.current[taskId];
    }
  };

  useEffect(() => {
    return () => {
      // Cancel all abort controllers
      Object.values(abortControllers.current).forEach(controller => {
        try {
          controller.abort();
        } catch (err) {
          console.error('[useTaskCleanup] Error aborting controller:', err);
        }
      });
      
      // Clear all intervals
      Object.values(statusCheckIntervals.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
    };
  }, []);

  return {
    abortControllers: abortControllers.current,
    statusCheckIntervals: statusCheckIntervals.current,
    registerTask,
    completeTask,
    failTask
  };
}
