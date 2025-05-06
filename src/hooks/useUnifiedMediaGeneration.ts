import { useState, useCallback, useRef } from 'react';
import { MediaServiceAdapter, MediaType, Task, cancelTask } from '@/adapters/mediaServiceAdapter';
import { toast } from 'sonner';

interface UseUnifiedMediaGenerationOptions {
  onComplete?: (mediaUrl: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface RetryState {
  retryCount: number;
  maxRetries: number;
  lastTaskId: string | null;
}

// This hook provides a unified interface for generating media using different services
export function useUnifiedMediaGeneration(options: UseUnifiedMediaGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Retry state with proper type definition
  const retryState = useRef<RetryState>({
    retryCount: 0,
    maxRetries: 3,
    lastTaskId: null,
  });

  // Clear any existing polling
  const clearPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setCurrentTaskId(null);
    setError(null);
    clearPolling();
    retryState.current = {
      retryCount: 0,
      maxRetries: 3,
      lastTaskId: null,
    };
  }, [clearPolling]);

  // Handle successful media generation
  const handleSuccess = useCallback((url: string) => {
    setMediaUrl(url);
    setIsGenerating(false);
    setProgress(100);
    clearPolling();
    
    if (options.onComplete) {
      options.onComplete(url);
    }
    
    // Reset retry state
    retryState.current.retryCount = 0;
    retryState.current.lastTaskId = null;
    
  }, [clearPolling, options]);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    console.error('[useUnifiedMediaGeneration] Error:', err);
    setError(err);
    setIsGenerating(false);
    clearPolling();
    
    if (options.onError) {
      options.onError(err);
    }
    
    toast.error(`Erro na geração de mídia: ${err.message}`);
    
    // Reset retry state
    retryState.current.retryCount = 0;
    retryState.current.lastTaskId = null;
  }, [clearPolling, options]);

  // Poll for task status
  const pollTaskStatus = useCallback(async (taskId: string, type: MediaType) => {
    if (!taskId || !isGenerating) return;
    
    try {
      console.log(`[useUnifiedMediaGeneration] Polling status for task ${taskId}`);
      
      // Simulate API call to check task status
      const response = await fetch(`/api/task/${taskId}/status?type=${type}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error checking task status');
      }
      
      const task: Task = await response.json();
      
      if (task.status === 'completed' && task.result) {
        console.log(`[useUnifiedMediaGeneration] Task completed:`, task.result);
        handleSuccess(task.result);
      } 
      else if (task.status === 'failed') {
        // Check if we should retry
        if (retryState.current.retryCount < retryState.current.maxRetries) {
          console.log(`[useUnifiedMediaGeneration] Task failed, retrying (${retryState.current.retryCount + 1}/${retryState.current.maxRetries})...`);
          retryState.current.retryCount++;
          // Retry logic would go here
        } else {
          throw new Error(task.error || 'Task failed');
        }
      } 
      else if (task.status === 'canceled') {
        resetState();
        toast.info('Geração de mídia cancelada');
      } 
      else {
        // Still processing
        if (task.percentage !== undefined) {
          setProgress(task.percentage);
          if (options.onProgress) {
            options.onProgress(task.percentage);
          }
        }
        
        // Continue polling
        timeoutRef.current = setTimeout(() => {
          pollTaskStatus(taskId, type);
        }, 2000);
      }
    } catch (err) {
      console.error('[useUnifiedMediaGeneration] Error checking task status:', err);
      
      // If we've exceeded max retries, throw the error
      if (retryState.current.retryCount >= retryState.current.maxRetries) {
        handleError(err instanceof Error ? err : new Error('Unknown error'));
      } else {
        // Otherwise, retry polling after a delay
        timeoutRef.current = setTimeout(() => {
          pollTaskStatus(taskId, type);
        }, 3000);
      }
    }
  }, [isGenerating, handleSuccess, handleError, options, resetState]);

  // Generate media
  const generateMedia = useCallback(async (
    type: MediaType,
    prompt: string,
    model: string,
    params: any,
    referenceUrl?: string
  ) => {
    if (isGenerating) {
      toast.error('Já existe uma geração em andamento');
      return null;
    }
    
    setIsGenerating(true);
    setMediaType(type);
    setProgress(0);
    setError(null);
    setMediaUrl(null);
    
    try {
      console.log(`[useUnifiedMediaGeneration] Generating ${type} with model ${model}`);
      
      // Call the appropriate service based on the type
      const requestBody = {
        prompt,
        model,
        params,
        referenceUrl,
        type
      };
      
      // Simulate API call to create task
      const response = await fetch(`/api/generate/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error starting generation task');
      }
      
      const data = await response.json();
      const taskId = data.taskId;
      
      if (!taskId) {
        throw new Error('No task ID received from server');
      }
      
      console.log(`[useUnifiedMediaGeneration] Task created: ${taskId}`);
      setCurrentTaskId(taskId);
      retryState.current.lastTaskId = taskId;
      
      // Begin polling for status
      pollTaskStatus(taskId, type);
      
      return taskId;
    } catch (err) {
      console.error(`[useUnifiedMediaGeneration] Error generating ${type}:`, err);
      handleError(err instanceof Error ? err : new Error('Failed to start generation'));
      return null;
    }
  }, [isGenerating, pollTaskStatus, handleError]);

  // Cancel generation
  const cancelGeneration = useCallback(async () => {
    if (!currentTaskId || !mediaType) return false;
    
    try {
      console.log(`[useUnifiedMediaGeneration] Cancelling task ${currentTaskId}`);
      
      // Call the cancellation service
      const success = await cancelTask(currentTaskId, mediaType);
      
      if (success) {
        resetState();
        toast.info('Geração cancelada');
        return true;
      } else {
        throw new Error('Failed to cancel task');
      }
    } catch (err) {
      console.error('[useUnifiedMediaGeneration] Error cancelling task:', err);
      toast.error('Erro ao cancelar geração');
      return false;
    }
  }, [currentTaskId, mediaType, resetState]);

  return {
    generateMedia,
    cancelGeneration,
    isGenerating,
    progress,
    mediaUrl,
    error,
    reset: resetState
  };
}
