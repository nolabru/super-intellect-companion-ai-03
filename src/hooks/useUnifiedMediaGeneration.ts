
import { useCallback, useState } from 'react';
import { useMediaServiceAdapter } from '@/adapters/mediaServiceAdapter';
import { toast } from 'sonner';
import { Task } from '@/hooks/useTaskManager';

interface UnifiedMediaGenerationOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showToasts?: boolean;
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
    onProgress,
    onComplete,
    onError
  } = options;

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedMedia, setGeneratedMedia] = useState<{
    type: 'image' | 'video' | 'audio';
    url: string;
  } | null>(null);
  
  const mediaService = useMediaServiceAdapter({
    service: 'auto',
    showToasts: false,
    onTaskUpdate: (task) => {
      if (task.id !== currentTaskId) return;
      
      setCurrentTask(task);
      
      if (onProgress && task.progress) {
        onProgress(task.progress);
      }
      
      if (task.status === 'completed' && task.result) {
        setIsGenerating(false);
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
        setIsGenerating(false);
        
        if (task.status === 'failed' && autoRetry && task.metadata?.retryCount < maxRetries) {
          // Auto retry failed tasks
          setTimeout(() => {
            if (showToasts) {
              toast.info(`Retry attempt ${(task.metadata?.retryCount || 0) + 1}/${maxRetries}`);
            }
            
            retryGeneration(task);
          }, retryDelay);
        } else if (task.status === 'failed') {
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
      task.metadata?.params,
      task.metadata?.referenceUrl
    );
    
    setCurrentTaskId(newTaskId);
    setIsGenerating(true);
    
    const newTask = mediaService.getTaskStatus(newTaskId);
    
    if (newTask) {
      mediaService.getTaskStatus(newTaskId)!.metadata = {
        ...task.metadata,
        retryCount: (task.metadata?.retryCount || 0) + 1
      };
    }
  }, [mediaService]);

  const generateMedia = useCallback((
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: any = {},
    referenceUrl?: string
  ) => {
    setIsGenerating(true);
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
      mediaService.getTaskStatus(taskId)!.metadata = {
        ...task.metadata,
        retryCount: 0
      };
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
    
    // State
    isGenerating,
    currentTask,
    generatedMedia,
    
    // Config methods
    configureApiKey: (key: string, service: 'apiframe' | 'piapi' = 'apiframe') => 
      mediaService.configureApiKey(key, service),
    isApiKeyConfigured: (service: 'apiframe' | 'piapi' = 'apiframe') => 
      mediaService.isApiKeyConfigured(service)
  };
}
