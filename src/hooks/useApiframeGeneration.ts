
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';
import { MediaGenerationResult } from '@/services/mediaService';
import { UseMediaGenerationOptions, GenerationTask } from '@/types/mediaGeneration';
import { ApiframeMediaType, ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';

/**
 * Hook for media generation using APIframe services
 * @param options Configuration options for media generation
 */
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

  /**
   * Generate media (image, video, audio) using APIframe services
   */
  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: ApiframeMediaType,
    model: string | ApiframeModel,
    params: ApiframeParams = {},
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
      
      console.log(`[useApiframeGeneration] Starting ${mediaType} generation with model: ${model}`, { params });
      
      // Use aiService to handle the generation
      const result = await aiService.generateMedia({
        modelId: model.toString(),
        prompt,
        type: mediaType,
        additionalParams: params,
        referenceUrl
      });
      
      console.log(`[useApiframeGeneration] Generation result:`, result);
      
      if (!result.success && !result.taskId) {
        throw new Error(result.error || `Failed to generate ${mediaType}`);
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
          
          // Check the status using aiService
          console.log(`[useApiframeGeneration] Polling status for task ${taskId}...`);
          const status = await aiService.checkMediaTaskStatus(taskId);
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
            return {
              success: true,
              taskId,
              mediaUrl: status.mediaUrl
            };
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
  
  /**
   * Cancel the current generation task
   */
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
      
      // Cancel the task using aiService
      const result = await aiService.cancelMediaTask(currentTask.taskId);
      
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

  /**
   * Configure APIframe API key - not needed anymore but kept for compatibility
   */
  const configureApiKey = useCallback((): boolean => {
    // Always return true since we're using a global key
    return true;
  }, []);

  /**
   * Check if APIframe API key is configured - always returns true now
   */
  const isApiKeyConfigured = useCallback((): boolean => {
    // Always return true since we're using a global key
    return true;
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
