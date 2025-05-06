
import { useTaskManager, Task } from '@/hooks/useSimplifiedTaskManager';
import { useSimplifiedMediaGeneration } from '@/hooks/useSimplifiedMediaGeneration';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface MediaServiceOptions {
  service: 'ideogram' | 'auto';
  showToasts?: boolean;
  onTaskUpdate?: (task: Task) => void;
}

/**
 * Adapter for media generation services
 * Creates a standardized interface for media generation
 */
export function useMediaServiceAdapter(options: MediaServiceOptions = { service: 'auto' }) {
  const {
    service = 'auto',
    showToasts = true,
    onTaskUpdate
  } = options;
  
  // Initialize the service
  const ideogramService = useSimplifiedMediaGeneration({ showToasts: false });
  
  // Get task manager for handling operations
  const taskManager = useTaskManager({
    showToasts,
    maxConcurrentTasks: 2,
    onTaskComplete: onTaskUpdate,
    onTaskFail: onTaskUpdate,
    onTaskStart: onTaskUpdate
  });

  // Register task processor for image generation
  taskManager.registerTaskProcessor('image', async (task: Task) => {
    try {
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType: 'ideogram'
        },
        progress: 10
      });
      
      // For now we only support Ideogram image generation
      const mediaUrl = await ideogramService.generateMedia(
        task.prompt,
        'image',
        task.model,
        task.metadata?.params || {},
        task.metadata?.referenceUrl
      );
      
      if (mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: mediaUrl
        };
      } else {
        throw new Error('No image was generated');
      }
    } catch (error) {
      console.error('[mediaServiceAdapter] Error generating image:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Register video processor using API Frame
  taskManager.registerTaskProcessor('video', async (task: Task) => {
    try {
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType: 'apiframe-video'
        },
        progress: 5,
        status: 'processing'
      });
      
      const params = task.metadata?.params || {};
      const referenceUrl = task.metadata?.referenceUrl;
      const isImageToVideo = params.videoType === 'image-to-video' || !!referenceUrl;
      
      // Call the apiframe-video-create-task function
      const { data, error } = await supabase.functions.invoke('apiframe-video-create-task', {
        body: {
          prompt: task.prompt,
          model: task.model,
          imageUrl: referenceUrl, // Pass the reference image if it's an image-to-video task
          params: params
        }
      });
      
      if (error) {
        console.error('[mediaServiceAdapter] Error creating video task:', error);
        throw new Error(`Error creating video task: ${error.message || 'Unknown error'}`);
      }
      
      if (!data.success || !data.taskId) {
        console.error('[mediaServiceAdapter] Invalid response from video task creation:', data);
        throw new Error('Failed to start video generation');
      }
      
      // Update task with task ID from API Frame
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          apiframeTaskId: data.taskId
        },
        progress: 15,
        status: 'processing'
      });
      
      // Start polling for status updates
      const maxPolls = 120; // Maximum number of polls (20 minutes at 10s intervals, increased from 10 minutes)
      let pollCount = 0;
      
      // Run initial poll immediately for faster response
      const initialResult = await checkVideoTaskStatus(data.taskId);
      if (initialResult.mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: initialResult.mediaUrl
        };
      }
      
      // If not already complete, start polling
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            pollCount++;
            
            // Check task status
            const result = await checkVideoTaskStatus(data.taskId);
            
            // Update progress based on poll count if no percentage available
            const estimatedProgress = Math.min(15 + (pollCount * 0.7), 95); // Adjusted to spread over 20 minutes
            
            // Update task status
            taskManager.updateTask(task.id, {
              progress: result.percentage || estimatedProgress,
              status: result.status || 'processing'
            });
            
            // If complete, resolve with result
            if (result.status === 'completed' && result.mediaUrl) {
              clearInterval(pollInterval);
              resolve({
                ...task,
                status: 'completed',
                progress: 100,
                result: result.mediaUrl
              });
            } 
            // If failed, reject with error
            else if (result.status === 'failed') {
              clearInterval(pollInterval);
              reject(new Error(result.error || 'Video generation failed'));
            }
            // If reached max polls, time out
            else if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              reject(new Error('Video generation timed out after 20 minutes'));
            }
          } catch (error) {
            console.error('[mediaServiceAdapter] Error polling video task status:', error);
            // Don't stop polling on a single error
          }
        }, 10000); // Poll every 10 seconds
      });
    } catch (error) {
      console.error('[mediaServiceAdapter] Error in video task processor:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
  
  // Helper function to check video task status
  const checkVideoTaskStatus = async (taskId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (error) {
        throw error;
      }
      
      return {
        status: data.status,
        mediaUrl: data.mediaUrl,
        error: data.error,
        percentage: data.percentage || 0
      };
    } catch (error) {
      console.error('[mediaServiceAdapter] Error checking task status:', error);
      throw error;
    }
  };

  // Register audio processor as placeholder
  taskManager.registerTaskProcessor('audio', async (task: Task) => {
    return {
      ...task,
      status: 'failed',
      progress: 0,
      error: 'Audio generation is not supported at this time'
    };
  });

  // Main public methods
  return {
    // Main method to generate any type of media
    generateMedia: (
      type: 'image' | 'video' | 'audio',
      prompt: string,
      model: string,
      params: any = {},
      referenceUrl?: string
    ) => {
      const taskId = taskManager.createTask(
        type,
        model,
        prompt,
        {
          params,
          referenceUrl
        }
      );
      
      if (showToasts) {
        toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started`, {
          description: 'Your request has been queued'
        });
      }
      
      return taskId;
    },
    
    // Shortcuts for specific media types
    generateImage: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('image', model, prompt, { params, referenceUrl }),
      
    generateVideo: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('video', model, prompt, { params, referenceUrl }),
      
    generateAudio: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('audio', model, prompt, { params, referenceUrl }),
    
    // Task management methods
    cancelTask: taskManager.cancelTask,
    getTaskStatus: taskManager.getTask,
    getAllTasks: () => Object.values(taskManager.tasks),
    getActiveTasks: () => taskManager.activeTasks.map(id => taskManager.getTask(id)!),
    getTaskQueue: () => taskManager.queue,
    
    // Service configuration methods
    configureApiKey: (key: string) => {
      // Placeholder for future needs
      return true;
    },
    
    isApiKeyConfigured: () => {
      // Placeholder for future needs
      return true;
    }
  };
}
