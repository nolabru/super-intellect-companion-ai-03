
import { useTaskManager, Task } from '@/hooks/useTaskManager';
import { useApiframeGeneration } from '@/hooks/useApiframeGeneration';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';
import { toast } from 'sonner';

export interface MediaServiceOptions {
  service: 'apiframe' | 'piapi' | 'auto';
  preferApiframe?: boolean;
  showToasts?: boolean;
  onTaskUpdate?: (task: Task) => void;
}

/**
 * Adapter for various media generation services
 * Creates a standardized interface regardless of underlying service
 */
export function useMediaServiceAdapter(options: MediaServiceOptions = { service: 'auto' }) {
  const {
    service = 'auto',
    preferApiframe = true,
    showToasts = true,
    onTaskUpdate
  } = options;
  
  // Initialize the services
  const apiframeService = useApiframeGeneration({ showToasts: false });
  const piapiService = useMediaGeneration({ showToasts: false });
  
  // Get task manager for handling all operations
  const taskManager = useTaskManager({
    showToasts,
    maxConcurrentTasks: 2,
    onTaskComplete: onTaskUpdate,
    onTaskFail: onTaskUpdate,
    onTaskStart: onTaskUpdate
  });

  // Determine which service to use by default
  const getPreferredService = (modelId: string) => {
    // Logic to determine which service handles this model
    const isApiframeModel = modelId.includes('stability') || 
                            modelId.includes('dall-e') ||
                            modelId.includes('runway') || 
                            modelId.includes('eleven');
    
    const isPiapiModel = modelId.includes('piapi') || 
                         modelId.includes('luma') ||
                         modelId.includes('kligin');
    
    if (service === 'apiframe') return 'apiframe';
    if (service === 'piapi') return 'piapi';
    
    // Auto detection
    if (isApiframeModel) return 'apiframe';
    if (isPiapiModel) return 'piapi';
    
    // Default to preferred service
    return preferApiframe ? 'apiframe' : 'piapi';
  };

  // Register task processors for different media types
  taskManager.registerTaskProcessor('image', async (task: Task) => {
    try {
      const serviceType = getPreferredService(task.model);
      
      // Update task metadata with service info
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType
        },
        progress: 10
      });
      
      let result;
      if (serviceType === 'apiframe') {
        result = await apiframeService.generateMedia(
          task.prompt,
          'image',
          task.model,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      } else {
        result = await piapiService.generateMedia(
          task.prompt,
          'image',
          task.model as any,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      }
      
      if (result.success && result.mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: result.mediaUrl
        };
      } else if (result.taskId) {
        // Task is being processed, need to poll for status
        return {
          ...task,
          status: 'processing',
          progress: 40,
          metadata: {
            ...task.metadata,
            taskId: result.taskId
          }
        };
      } else {
        throw new Error(result.error || 'Unknown error generating image');
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

  taskManager.registerTaskProcessor('video', async (task: Task) => {
    try {
      const serviceType = getPreferredService(task.model);
      
      // Update task metadata with service info
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType
        },
        progress: 10
      });
      
      let result;
      if (serviceType === 'apiframe') {
        result = await apiframeService.generateMedia(
          task.prompt,
          'video',
          task.model,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      } else {
        result = await piapiService.generateMedia(
          task.prompt,
          'video',
          task.model as any,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      }
      
      if (result.success && result.mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: result.mediaUrl
        };
      } else if (result.taskId) {
        // Task is being processed, need to poll for status
        return {
          ...task,
          status: 'processing',
          progress: 30,
          metadata: {
            ...task.metadata,
            taskId: result.taskId
          }
        };
      } else {
        throw new Error(result.error || 'Unknown error generating video');
      }
    } catch (error) {
      console.error('[mediaServiceAdapter] Error generating video:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  taskManager.registerTaskProcessor('audio', async (task: Task) => {
    try {
      const serviceType = getPreferredService(task.model);
      
      // Update task metadata with service info
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType
        },
        progress: 10
      });
      
      let result;
      if (serviceType === 'apiframe') {
        result = await apiframeService.generateMedia(
          task.prompt,
          'audio',
          task.model,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      } else {
        result = await piapiService.generateMedia(
          task.prompt,
          'audio',
          task.model as any,
          task.metadata?.params || {},
          task.metadata?.referenceUrl
        );
      }
      
      if (result.success && result.mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: result.mediaUrl
        };
      } else if (result.taskId) {
        // Task is being processed, need to poll for status
        return {
          ...task,
          status: 'processing',
          progress: 35,
          metadata: {
            ...task.metadata,
            taskId: result.taskId
          }
        };
      } else {
        throw new Error(result.error || 'Unknown error generating audio');
      }
    } catch (error) {
      console.error('[mediaServiceAdapter] Error generating audio:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
    configureApiKey: (key: string, service: 'apiframe' | 'piapi' = 'apiframe') => {
      if (service === 'apiframe') {
        return apiframeService.configureApiKey(key);
      } else {
        return piapiService.configureApiKey(key);
      }
    },
    
    isApiKeyConfigured: (service: 'apiframe' | 'piapi' = 'apiframe') => {
      if (service === 'apiframe') {
        return apiframeService.isApiKeyConfigured();
      } else {
        return piapiService.isApiKeyConfigured();
      }
    }
  };
}
