import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiframeService } from '@/services/apiframeService';
import { aiService } from '@/services/aiService';
import { MediaGenerationResult } from '@/services/mediaService';
import { UseMediaGenerationOptions, GenerationTask } from '@/types/mediaGeneration';
import { ApiframeMediaType, ApiframeModel } from '@/types/apiframeGeneration';

export function useApiframeGeneration(options: UseMediaGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<GenerationTask | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { 
    showToasts = true, 
    onProgress, 
    onComplete, 
    autoSaveToGallery = false 
  } = options;

  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: ApiframeMediaType,
    model: ApiframeModel,
    params: Record<string, any> = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    if (isGenerating) {
      if (showToasts) {
        toast.error('Another generation is already in progress');
      }
      throw new Error('Another generation is already in progress');
    }

    try {
      setIsGenerating(true);
      
      // Start the progress indicator
      if (onProgress) {
        onProgress(0);
      }
      
      // Use the appropriate service based on media type
      let result;
      
      if (mediaType === 'image') {
        result = await apiframeService.generateImage(prompt, model as string, params);
      } else if (mediaType === 'video') {
        result = await apiframeService.generateVideo(prompt, model as string, params, referenceUrl);
      } else if (mediaType === 'audio') {
        result = await apiframeService.generateAudio(prompt, model as string, params);
      } else {
        throw new Error(`Unsupported media type: ${mediaType}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate media');
      }
      
      const taskId = result.taskId;
      if (!taskId) {
        throw new Error('No task ID received');
      }
      
      // Update the current task
      setCurrentTask({
        taskId,
        progress: 0,
        status: 'pending'
      });
      
      if (showToasts) {
        toast.success('Generation started', {
          description: `Your ${mediaType} is being generated. This might take a moment.`
        });
      }
      
      // If we already have a mediaUrl in the result, we can return it
      if (result.mediaUrl) {
        setCurrentTask({
          taskId,
          progress: 100,
          status: 'completed',
          mediaUrl: result.mediaUrl
        });
        
        if (onProgress) onProgress(100);
        if (onComplete) onComplete(result);
        
        setIsGenerating(false);
        return result;
      }
      
      // Otherwise, set up polling for the task status
      let progress = 10;
      const updateProgress = () => {
        // Simulate progress until we get the real status
        if (progress < 90) {
          progress += 5;
          if (onProgress) onProgress(progress);
          setCurrentTask(prev => prev ? { ...prev, progress } : null);
        }
      };
      
      // Clear any existing polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Set up polling
      const poll = setInterval(async () => {
        try {
          updateProgress();
          
          // Check the status
          const status = await apiframeService.checkTaskStatus(taskId);
          console.log(`[useApiframeGeneration] Task status:`, status);
          
          if (status.mediaUrl) {
            // Task completed successfully
            clearInterval(poll);
            setPollingInterval(null);
            
            if (onProgress) onProgress(100);
            
            setCurrentTask({
              taskId,
              progress: 100,
              status: 'completed',
              mediaUrl: status.mediaUrl
            });
            
            if (onComplete) {
              onComplete({
                success: true,
                mediaUrl: status.mediaUrl,
                taskId
              });
            }
            
            setIsGenerating(false);
            return status;
          } else if (status.error) {
            // Task failed
            clearInterval(poll);
            setPollingInterval(null);
            setIsGenerating(false);
            
            setCurrentTask({
              taskId,
              progress: 0,
              status: 'failed',
              error: status.error
            });
            
            throw new Error(status.error);
          }
        } catch (err) {
          console.error(`[useApiframeGeneration] Error polling task status:`, err);
          
          clearInterval(poll);
          setPollingInterval(null);
          setIsGenerating(false);
          
          throw err;
        }
      }, 3000);
      
      setPollingInterval(poll);
      
      // Return the initial result
      return {
        success: true,
        taskId,
      };
    } catch (err) {
      console.error(`[useApiframeGeneration] Error generating ${mediaType}:`, err);
      setIsGenerating(false);
      
      if (showToasts) {
        toast.error(`Error generating ${mediaType}`, {
          description: err instanceof Error ? err.message : 'Unknown error'
        });
      }
      
      throw err;
    }
  }, [isGenerating, pollingInterval, showToasts, onProgress, onComplete]);
  
  const cancelTask = useCallback(async (): Promise<boolean> => {
    if (!currentTask?.taskId) {
      return false;
    }
    
    try {
      // Clear polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Cancel the task
      const result = await apiframeService.cancelTask(currentTask.taskId);
      
      // Reset state
      setIsGenerating(false);
      setCurrentTask(prev => prev ? { ...prev, status: 'failed', error: 'Canceled by user' } : null);
      
      if (showToasts) {
        toast.info('Generation canceled');
      }
      
      return result;
    } catch (err) {
      console.error('[useApiframeGeneration] Error canceling task:', err);
      
      if (showToasts) {
        toast.error('Failed to cancel generation');
      }
      
      return false;
    }
  }, [currentTask, pollingInterval, showToasts]);

  const configureApiKey = useCallback((key: string): boolean => {
    return apiframeService.setApiKey(key);
  }, []);

  const isApiKeyConfigured = useCallback((): boolean => {
    return apiframeService.isApiKeyConfigured();
  }, []);
  
  return {
    generateMedia,
    cancelTask,
    isGenerating,
    currentTask,
    configureApiKey,
    isApiKeyConfigured
  };
}
