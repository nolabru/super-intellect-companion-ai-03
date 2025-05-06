
import { useTaskManager, Task } from '@/hooks/useSimplifiedTaskManager';
import { useSimplifiedMediaGeneration } from '@/hooks/useSimplifiedMediaGeneration';
import { toast } from 'sonner';

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

  // Register placeholder processors for video and audio
  // These don't actually do anything yet - just placeholders
  taskManager.registerTaskProcessor('video', async (task: Task) => {
    return {
      ...task,
      status: 'failed',
      progress: 0,
      error: 'Video generation is not supported at this time'
    };
  });

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
