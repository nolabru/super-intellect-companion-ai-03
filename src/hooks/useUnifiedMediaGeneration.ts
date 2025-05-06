
import { useCallback, useState } from 'react';
import { useMediaServiceAdapter } from '@/adapters/mediaServiceAdapter';
import { toast } from 'sonner';
import { Task } from '@/hooks/useSimplifiedTaskManager';
import { withRetry } from '@/utils/retryOperations';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedMediaGenerationOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showToasts?: boolean;
  timeoutDuration?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (mediaUrl: string) => void;
  onError?: (error: string) => void;
}

/**
 * Unified hook for generating all types of media in a consistent way
 */
export function useUnifiedMediaGeneration(options: UnifiedMediaGenerationOptions = {}) {
  const {
    autoRetry = true,
    maxRetries = 2,
    retryDelay = 2000,
    showToasts = true,
    timeoutDuration = 600000, // 10 minutes timeout (default)
    onProgress,
    onComplete,
    onError
  } = options;

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [generatedMedia, setGeneratedMedia] = useState<{
    type: 'image' | 'video' | 'audio';
    url: string;
  } | null>(null);
  
  const mediaService = useMediaServiceAdapter({
    service: 'auto',
    showToasts: false,
    onTaskUpdate: (task) => {
      if (task.id !== currentTaskId) return;
      
      // Fix the type issue by not using instanceof with task.createdAt
      const updatedTask = {
        ...task,
        // Safely handle createdAt regardless of its type
        createdAt: typeof task.createdAt === 'string' 
          ? task.createdAt 
          : String(task.createdAt)
      };
      
      setCurrentTask(updatedTask as unknown as Task);
      
      if (onProgress && task.progress) {
        onProgress(task.progress);
      }
      
      if (task.status === 'completed' && task.result) {
        setIsGenerating(false);
        setTimedOut(false);
        setGeneratedMedia({
          type: task.type as any,
          url: task.result
        });
        
        if (showToasts) {
          toast.success(`${task.type.charAt(0).toUpperCase() + task.type.slice(1)} generated successfully`);
        }
        
        if (onComplete) {
          onComplete(task.result);
        }
      } else if (task.status === 'failed' || task.status === 'canceled') {
        const isTimeout = task.error?.includes('timed out');
        
        if (isTimeout) {
          setTimedOut(true);
          
          if (showToasts) {
            toast.warning('Video generation is taking longer than expected', {
              description: 'You can check status again or wait for it to complete'
            });
          }
        } else {
          setIsGenerating(false);
        }
        
        if (task.status === 'failed' && !isTimeout && autoRetry && 
            task.metadata?.retryCount !== undefined && 
            task.metadata.retryCount < maxRetries) {
          // Auto retry failed tasks (not for timeouts)
          setTimeout(() => {
            if (showToasts) {
              toast.info(`Retry attempt ${(task.metadata?.retryCount || 0) + 1}/${maxRetries}`);
            }
            
            retryGeneration(task as unknown as Task);
          }, retryDelay);
        } else if (task.status === 'failed' && !isTimeout) {
          if (showToasts) {
            toast.error(`Failed to generate ${task.type}`, {
              description: task.error || 'Unknown error'
            });
          }
          
          if (onError) {
            onError(task.error || 'Unknown error');
          }
        }
      }
    }
  });
  
  const retryGeneration = useCallback((task: Task) => {
    if (!task) return;
    
    // Create a new task with same parameters but increment retry count
    const newTaskId = mediaService.generateMedia(
      task.type as any,
      task.prompt,
      task.model,
      task.metadata?.params
    );
    
    setCurrentTaskId(newTaskId);
    setIsGenerating(true);
    setTimedOut(false);
    
    const newTask = mediaService.getTaskStatus(newTaskId);
    
    if (newTask) {
      const retryCount = (task.metadata?.retryCount !== undefined) ? (task.metadata.retryCount + 1) : 1;
      // Instead of trying to directly update the task, we'll create a new task with the updated metadata
      // This avoids using the non-existent updateTask method
      if (newTask.metadata) {
        newTask.metadata.retryCount = retryCount;
      } else {
        newTask.metadata = { retryCount };
      }
    }
  }, [mediaService]);
  
  // New method to check status of a timed out task
  const checkTimedOutTask = useCallback(async () => {
    if (!currentTaskId || !currentTask) return;
    
    // Get the API Frame task ID from the currentTask metadata
    const apiframeTaskId = currentTask.metadata?.apiframeTaskId;
    if (!apiframeTaskId) return;
    
    setIsGenerating(true);
    
    try {
      // Use withRetry to make the check more reliable
      const { data, error } = await withRetry(
        () => supabase.functions.invoke('apiframe-task-status', {
          body: { taskId: apiframeTaskId }
        }),
        { maxRetries: 3, initialDelay: 1000 }
      );
      
      if (error) {
        console.error('[useUnifiedMediaGeneration] Error checking timed out task:', error);
        throw error;
      }
      
      if (data.status === 'completed' && data.mediaUrl) {
        // Task completed successfully after timeout
        setIsGenerating(false);
        setTimedOut(false);
        setGeneratedMedia({
          type: currentTask.type as any,
          url: data.mediaUrl
        });
        
        if (showToasts) {
          toast.success(`${currentTask.type.charAt(0).toUpperCase() + currentTask.type.slice(1)} generated successfully`);
        }
        
        if (onComplete) {
          onComplete(data.mediaUrl);
        }
        
        // Instead of directly updating task via updateTask, we'll handle task state in the local state
        // and notify our listeners with the updated status
        setCurrentTask({
          ...currentTask,
          status: 'completed',
          progress: 100,
          result: data.mediaUrl
        });
        
        return true;
      } else if (data.status === 'processing') {
        // Still processing
        if (showToasts) {
          toast.info('Video still processing', {
            description: `Processing: ${data.percentage || 0}% complete`
          });
        }
        
        // Update the local task state instead of using updateTask
        setCurrentTask({
          ...currentTask,
          status: 'processing',
          progress: data.percentage || 50
        });
        
        return false;
      } else {
        // Failed or unknown status
        setIsGenerating(false);
        
        if (showToasts) {
          toast.error(`Failed to generate ${currentTask.type}`, {
            description: data.error || 'Unknown error'
          });
        }
        
        if (onError) {
          onError(data.error || 'Unknown error');
        }
        
        return false;
      }
    } catch (err) {
      console.error('[useUnifiedMediaGeneration] Error in checkTimedOutTask:', err);
      setIsGenerating(false);
      
      const errorMsg = err instanceof Error ? err.message : 'Unknown error checking status';
      
      if (showToasts) {
        toast.error('Error checking video status', {
          description: errorMsg
        });
      }
      
      if (onError) {
        onError(errorMsg);
      }
      
      return false;
    }
  }, [currentTaskId, currentTask, showToasts, onComplete, onError]);

  const generateMedia = useCallback((
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: any = {},
    referenceUrl?: string
  ) => {
    setIsGenerating(true);
    setTimedOut(false);
    setGeneratedMedia(null);
    
    const taskId = mediaService.generateMedia(
      type,
      prompt,
      model,
      params,
      referenceUrl
    );
    
    setCurrentTaskId(taskId);
    
    // Set initial metadata
    const task = mediaService.getTaskStatus(taskId);
    if (task) {
      // Update the task's metadata directly if it exists
      if (task.metadata) {
        task.metadata.retryCount = 0;
      } else {
        task.metadata = { retryCount: 0 };
      }
    }
    
    if (showToasts) {
      toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started`);
    }
    
    return taskId;
  }, [mediaService, showToasts]);
  
  const cancelGeneration = useCallback(() => {
    if (!currentTaskId) return false;
    
    const result = mediaService.cancelTask(currentTaskId);
    
    if (result) {
      setIsGenerating(false);
      setTimedOut(false);
      
      if (showToasts) {
        toast.info('Generation canceled');
      }
    }
    
    return result;
  }, [currentTaskId, mediaService, showToasts]);
  
  return {
    // Main methods
    generateMedia,
    generateImage: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('image', prompt, model, params, referenceUrl),
    generateVideo: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('video', prompt, model, params, referenceUrl),
    generateAudio: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      generateMedia('audio', prompt, model, params, referenceUrl),
    cancelGeneration,
    checkTimedOutTask,
    
    // State
    isGenerating,
    timedOut,
    currentTask,
    generatedMedia,
    
    // Config methods
    configureApiKey: (key: string) => 
      mediaService.configureApiKey(key),
    isApiKeyConfigured: () => 
      mediaService.isApiKeyConfigured()
  };
}
