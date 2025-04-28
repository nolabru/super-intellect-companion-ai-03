
import { useRef, useEffect } from 'react';
import { UseMediaGenerationOptions } from '@/types/apiframeGeneration';

export function useTaskCleanup(options: UseMediaGenerationOptions = {}) {
  const abortControllers = useRef<Record<string, AbortController>>({}).current;
  const statusCheckIntervals = useRef<Record<string, number>>({}).current;
  
  useEffect(() => {
    // Cleanup function to abort any pending requests and clear intervals on unmount
    return () => {
      Object.values(abortControllers).forEach(controller => controller.abort());
      Object.values(statusCheckIntervals).forEach(intervalId => clearInterval(intervalId));
    };
  }, []);
  
  return {
    abortControllers,
    statusCheckIntervals
  };
}
