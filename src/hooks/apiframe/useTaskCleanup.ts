
import { useEffect, useRef } from 'react';
import { UseMediaGenerationOptions } from '@/types/apiframeGeneration';

/**
 * Hook for managing cleanup of task-related resources
 */
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
