
import { useTaskManager, Task } from '@/hooks/useSimplifiedTaskManager';
import { useSimplifiedMediaGeneration } from '@/hooks/useSimplifiedMediaGeneration';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface MediaServiceOptions {
  service: 'ideogram' | 'apiframe' | 'auto';
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
  
  // Initialize the services
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

  // Register processor for video generation
  taskManager.registerTaskProcessor('video', async (task: Task) => {
    try {
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType: 'apiframe'
        },
        progress: 5
      });
      
      console.log('[mediaServiceAdapter] Starting video generation with task:', task);
      
      // Get parameters from task metadata
      const params = task.metadata?.params || {};
      const referenceUrl = task.metadata?.referenceUrl;
      
      // Determine generation type based on reference URL
      const generationType = referenceUrl ? "image2video" : "text2video";
      
      // Call the edge function to start generation
      const { data, error } = await supabase.functions.invoke('apiframe-kling-video', {
        body: {
          prompt: task.prompt,
          imageUrl: referenceUrl,
          generationType,
          params: {
            ...params,
            model: "kling-v1-5", // Default to latest model
            duration: params.duration || 5,
            aspectRatio: params.aspectRatio || "16:9",
            mode: params.mode || "std",
            cfgScale: params.cfgScale !== undefined ? params.cfgScale : 0.7
          }
        }
      });
      
      if (error) {
        console.error('[mediaServiceAdapter] Error calling apiframe-kling-video:', error);
        throw new Error(`Failed to start video generation: ${error.message}`);
      }
      
      if (!data || !data.taskId) {
        throw new Error('Failed to start video generation: No task ID received');
      }
      
      console.log('[mediaServiceAdapter] Video generation task created:', data);
      
      // Update task with API task ID for tracking
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          apiTaskId: data.taskId
        },
        progress: 10
      });
      
      // Start polling for status updates
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes total (10 seconds * 60)
      let finalResult = null;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Wait 10 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check if task was cancelled
        const currentTask = taskManager.getTask(task.id);
        if (!currentTask || currentTask.status === 'canceled') {
          console.log('[mediaServiceAdapter] Task was cancelled, stopping polling');
          break;
        }
        
        // Check status from API
        const { data: statusData, error: statusError } = await supabase.functions.invoke('apiframe-task-status', {
          body: { taskId: data.taskId }
        });
        
        if (statusError) {
          console.error('[mediaServiceAdapter] Error checking task status:', statusError);
          continue;
        }
        
        console.log('[mediaServiceAdapter] Video task status update:', statusData);
        
        if (!statusData) continue;
        
        // Update task progress
        taskManager.updateTask(task.id, {
          progress: statusData.progress || Math.min(10 + attempts * 2, 90)
        });
        
        // Check if task is complete
        if (statusData.status === 'completed' && statusData.mediaUrl) {
          finalResult = statusData.mediaUrl;
          break;
        }
        
        // Check if task failed
        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Video generation failed');
        }
      }
      
      // Check if we have a result
      if (finalResult) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: finalResult
        };
      }
      
      // If we reached here without a result, the task may still be processing
      return {
        ...task,
        status: 'processing',
        progress: 95,
        error: 'Video generation is taking longer than expected. It will be delivered when ready.'
      };
    } catch (error) {
      console.error('[mediaServiceAdapter] Error in video processor:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error during video generation'
      };
    }
  });

  // Register placeholder processor for audio
  taskManager.registerTaskProcessor('audio', async (task: Task) => {
    return {
      ...task,
      status: 'failed',
      progress: 0,
      error: 'Audio generation is not supported at this time'
    };
  });

  // Setup real-time updates
  const setupRealtimeUpdates = () => {
    console.log('[mediaServiceAdapter] Setting up realtime updates for media tasks');
    
    const subscription = supabase
      .channel('media-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'media_ready_events'
      }, payload => {
        console.log('[mediaServiceAdapter] Received media ready event:', payload);
        
        const { task_id, media_url, media_type, status } = payload.new;
        
        // Try to find a task that matches this API task ID
        if (task_id && media_url) {
          // Look through all tasks for matching API task ID in metadata
          Object.values(taskManager.tasks).forEach(task => {
            if (task.metadata?.apiTaskId === task_id) {
              console.log('[mediaServiceAdapter] Found matching task for update:', task.id);
              
              if (status === 'completed') {
                taskManager.updateTask(task.id, {
                  status: 'completed',
                  progress: 100,
                  result: media_url
                });
              } else if (status === 'failed') {
                taskManager.updateTask(task.id, {
                  status: 'failed',
                  progress: 0,
                  error: payload.new.error || 'Media generation failed'
                });
              }
            }
          });
        }
      })
      .subscribe((status) => {
        console.log('[mediaServiceAdapter] Realtime subscription status:', status);
      });
    
    return () => {
      console.log('[mediaServiceAdapter] Unsubscribing from realtime updates');
      supabase.removeChannel(subscription);
    };
  };
  
  // Setup realtime updates
  const cleanup = setupRealtimeUpdates();

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
    },
    
    // Cleanup method
    cleanup
  };
}
