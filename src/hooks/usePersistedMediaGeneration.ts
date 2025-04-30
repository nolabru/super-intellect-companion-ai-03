
import { useState, useCallback, useEffect } from 'react';
import { useApiframeGeneration } from './useApiframeGeneration';
import { ApiframeParams } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';

interface MediaTask {
  id: string;
  type: 'image' | 'video' | 'audio';
  status: string;
  progress: number;
  mediaUrl?: string;
  error?: string;
  prompt: string;
}

interface PersistedMediaGenerationOptions {
  showToasts?: boolean;
  onComplete?: (mediaUrl: string) => void;
}

/**
 * Custom hook for handling media generation with persistence across page refreshes
 */
export function usePersistedMediaGeneration(options: PersistedMediaGenerationOptions = {}) {
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; type: string } | null>(null);
  const [persistedTask, setPersistedTask] = useState<MediaTask | null>(null);
  
  const { showToasts = true, onComplete } = options;
  
  // Use the base APIframe generation hook
  const apiframeGeneration = useApiframeGeneration({
    showToasts: false // We'll handle toasts ourselves
  });
  
  // Check for persisted task on mount
  useEffect(() => {
    const savedTask = localStorage.getItem('apiframe_media_task');
    if (savedTask) {
      try {
        const task = JSON.parse(savedTask) as MediaTask;
        setPersistedTask(task);
        
        // Check if there's a completed task to display
        if (task.status === 'completed' && task.mediaUrl) {
          setGeneratedMedia({
            url: task.mediaUrl,
            type: task.type
          });
        } 
        // If task is still pending or processing, check status
        else if (task.status === 'pending' || task.status === 'processing') {
          checkTaskStatus(task.id);
        }
      } catch (error) {
        console.error('Error parsing persisted task:', error);
        localStorage.removeItem('apiframe_media_task');
      }
    }
  }, []);
  
  // Function to check the status of a task
  const checkTaskStatus = useCallback(async (taskId: string) => {
    try {
      // FIX: Replace checkTaskStatus with the correct method from aiService
      // We need to check the current task status
      if (apiframeGeneration.currentTask && apiframeGeneration.currentTask.taskId === taskId) {
        const result = {
          success: true,
          status: apiframeGeneration.currentTask.status === 'completed' ? 'completed' : 'processing',
          progress: apiframeGeneration.currentTask.progress,
          mediaUrl: apiframeGeneration.currentTask.mediaUrl,
          error: apiframeGeneration.currentTask.error
        };
        
        // Update persisted task
        const updatedTask = {
          ...persistedTask!,
          status: result.status || 'pending',
          progress: result.progress || 0,
          mediaUrl: result.mediaUrl,
          error: result.error
        };
        
        setPersistedTask(updatedTask);
        localStorage.setItem('apiframe_media_task', JSON.stringify(updatedTask));
        
        // If completed, update generated media
        if (result.status === 'completed' && result.mediaUrl) {
          setGeneratedMedia({
            url: result.mediaUrl,
            type: persistedTask!.type
          });
          
          if (showToasts) {
            toast.success(`${updatedTask.type.charAt(0).toUpperCase() + updatedTask.type.slice(1)} generated successfully!`);
          }
          
          if (onComplete) {
            onComplete(result.mediaUrl);
          }
        }
        
        // If still processing, check again in a few seconds
        if (result.status === 'pending' || result.status === 'processing') {
          setTimeout(() => checkTaskStatus(taskId), 3000);
        }
        
        // If there's an error, show it
        if (result.status === 'failed' && result.error && showToasts) {
          toast.error(`Generation failed: ${result.error}`);
        }
      } else {
        // If we don't have the task in memory, we need to clear it from localStorage
        // since we can't check its status
        console.warn('Task not found in memory:', taskId);
        localStorage.removeItem('apiframe_media_task');
        setPersistedTask(null);
      }
    } catch (error) {
      console.error('Error checking task status:', error);
      if (showToasts) {
        toast.error('Failed to check task status');
      }
    }
  }, [apiframeGeneration, persistedTask, showToasts, onComplete]);
  
  // Main function to generate media
  const generateMedia = useCallback(async (
    type: 'image' | 'video' | 'audio',
    prompt: string,
    modelId: string,
    params: ApiframeParams = {},
    referenceUrl?: string
  ) => {
    if (showToasts) {
      toast.info(`Generating ${type}...`);
    }
    
    try {
      // Map UI model ID to APIframe model ID
      const apiframeModelId = getApiframeModelId(modelId);
      
      // Generate media
      const result = await apiframeGeneration.generateMedia(
        prompt,
        type,
        apiframeModelId,
        params,
        referenceUrl
      );
      
      if (result.success && result.taskId) {
        // Persist task
        const task: MediaTask = {
          id: result.taskId,
          type,
          status: result.status || 'pending',
          progress: 0,
          mediaUrl: result.mediaUrl,
          error: result.error,
          prompt
        };
        
        setPersistedTask(task);
        localStorage.setItem('apiframe_media_task', JSON.stringify(task));
        
        // If not immediately completed, start checking status
        if (result.status !== 'completed') {
          setTimeout(() => checkTaskStatus(result.taskId!), 2000);
        } 
        // If immediately completed, update generated media
        else if (result.mediaUrl) {
          setGeneratedMedia({
            url: result.mediaUrl,
            type
          });
          
          if (showToasts) {
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
          }
          
          if (onComplete) {
            onComplete(result.mediaUrl);
          }
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate media');
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      if (showToasts) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to generate ${type}: ${errorMessage}`);
      }
      throw error;
    }
  }, [apiframeGeneration, checkTaskStatus, showToasts, onComplete]);
  
  // Cancel current generation
  const cancelGeneration = useCallback(async () => {
    if (!persistedTask?.id) {
      return false;
    }
    
    try {
      // FIX: Use the correct cancelTask method
      const result = await apiframeGeneration.cancelTask(persistedTask.id);
      
      if (result) {
        // Clear persisted task
        localStorage.removeItem('apiframe_media_task');
        setPersistedTask(null);
        
        if (showToasts) {
          toast.info('Generation canceled');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error canceling task:', error);
      if (showToasts) {
        toast.error('Failed to cancel generation');
      }
      return false;
    }
  }, [apiframeGeneration, persistedTask, showToasts]);
  
  // Clear persisted media
  const clearMedia = useCallback(() => {
    setGeneratedMedia(null);
    setPersistedTask(null);
    localStorage.removeItem('apiframe_media_task');
  }, []);
  
  return {
    generateMedia,
    cancelGeneration,
    clearMedia,
    isGenerating: apiframeGeneration.isGenerating || (persistedTask?.status === 'pending' || persistedTask?.status === 'processing'),
    generatedMedia,
    currentTask: apiframeGeneration.currentTask,
    persistedTask
  };
}
