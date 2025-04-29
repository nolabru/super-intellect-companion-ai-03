
import { useEffect, useRef } from 'react';
import { UseMediaGenerationOptions } from '@/types/mediaGeneration';
import { trackMediaEvent } from '@/services/mediaAnalyticsService';

export function useTaskCleanup(options: UseMediaGenerationOptions = {}) {
  const abortControllers = useRef<Record<string, AbortController>>({});
  const statusCheckIntervals = useRef<Record<string, number>>({});

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
      Object.keys(abortControllers.current).forEach(taskId => {
        trackMediaEvent({
          eventType: 'generation_canceled',
          mediaType: 'image', // Default type, ideally we'd store the actual type
          taskId
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
    statusCheckIntervals: statusCheckIntervals.current
  };
}
