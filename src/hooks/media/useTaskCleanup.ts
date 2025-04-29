
import { useEffect, useRef } from 'react';
import { UseMediaGenerationOptions } from '@/types/mediaGeneration';
import { trackMediaEvent } from '@/services/mediaAnalyticsService';

export function useTaskCleanup(options: UseMediaGenerationOptions = {}) {
  const abortControllers = useRef<Record<string, AbortController>>({});
  const statusCheckIntervals = useRef<Record<string, number>>({});
  const taskStartTimes = useRef<Record<string, number>>({});

  // Method to register a task for tracking
  const registerTask = (taskId: string, mediaType: 'image' | 'video' | 'audio', modelId?: string) => {
    // Record the start time
    taskStartTimes.current[taskId] = Date.now();
    
    // Track the start event
    trackMediaEvent({
      eventType: 'generation_started',
      mediaType,
      taskId,
      modelId,
      metadata: {
        startTime: taskStartTimes.current[taskId]
      }
    });
    
    // Return the abort controller for this task
    abortControllers.current[taskId] = new AbortController();
    return abortControllers.current[taskId];
  };

  // Method to track generation completed
  const completeTask = (taskId: string, mediaType: 'image' | 'video' | 'audio', modelId?: string, mediaUrl?: string) => {
    const startTime = taskStartTimes.current[taskId];
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Track completion
    trackMediaEvent({
      eventType: 'generation_completed',
      mediaType,
      taskId,
      modelId,
      duration,
      metadata: {
        mediaUrl
      }
    });
    
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
  const failTask = (taskId: string, mediaType: 'image' | 'video' | 'audio', modelId?: string, error?: string) => {
    const startTime = taskStartTimes.current[taskId];
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Track failure
    trackMediaEvent({
      eventType: 'generation_failed',
      mediaType,
      taskId,
      modelId,
      duration,
      details: { 
        error: error || 'Unknown error',
        startTime
      }
    });
    
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
      
      // Track cancellation events for any active tasks
      Object.entries(abortControllers.current).forEach(([taskId, _]) => {
        const startTime = taskStartTimes.current[taskId];
        const duration = startTime ? Date.now() - startTime : undefined;
        
        trackMediaEvent({
          eventType: 'generation_canceled',
          mediaType: 'image', // Default type, ideally we'd store the actual type
          taskId,
          duration,
          details: {
            reason: 'Component unmounted',
            startTime
          }
        });
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
