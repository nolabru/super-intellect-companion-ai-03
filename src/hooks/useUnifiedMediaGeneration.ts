
import { useCallback, useState } from 'react';
import { useMediaServiceAdapter } from '@/adapters/mediaServiceAdapter';
import { tokenService } from '@/services/tokenService';
import { tokenEvents } from '@/components/TokenDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Task } from '@/hooks/useSimplifiedTaskManager';

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
  
  const { user } = useAuth();
  
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
        setGeneratedMedia({
          type: task.type as any,
          url: task.result
        });
        
        // Consume tokens when task completes successfully
        if (user && task.model) {
          tokenService.consumeTokens(user.id, task.model, task.type).then(() => {
            // Trigger token refresh event
            tokenEvents.triggerRefresh();
            
            console.log('Tokens consumed and refresh triggered for completed media generation task');
          }).catch(err => {
            console.error('Error consuming tokens:', err);
          });
        }
        
        if (showToasts) {
          toast.success(`${task.type.charAt(0).toUpperCase() + task.type.slice(1)} generated successfully`);
        }
        
        if (onComplete) {
          onComplete(task.result);
        }
      } else if (task.status === 'failed' || task.status === 'canceled') {
        setIsGenerating(false);
        
        if (task.status === 'failed' && autoRetry && 
            task.metadata?.retryCount !== undefined && 
            task.metadata.retryCount < maxRetries) {
          // Auto retry failed tasks
          setTimeout(() => {
            if (showToasts) {
              toast.info(`Retry attempt ${(task.metadata?.retryCount || 0) + 1}/${maxRetries}`);
            }
            
            retryGeneration(task as unknown as Task);
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
      task.metadata?.params
    );
    
    setCurrentTaskId(newTaskId);
    setIsGenerating(true);
    
    const newTask = mediaService.getTaskStatus(newTaskId);
    
    if (newTask) {
      const retryCount = (task.metadata?.retryCount !== undefined) ? (task.metadata.retryCount + 1) : 1;
      // Update metadata without directly modifying the task object
      mediaService.getTaskStatus(newTaskId)!.metadata = {
        ...task.metadata,
        retryCount
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
      // Update metadata without directly modifying the task object
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
    configureApiKey: (key: string) => 
      mediaService.configureApiKey(key),
    isApiKeyConfigured: () => 
      mediaService.isApiKeyConfigured()
  };
}
