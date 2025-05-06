
import { sunoService } from '@/services/sunoService';

export type MediaType = 'image' | 'video' | 'audio' | 'music';

export interface Task<T = any> {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  result?: T;
  error?: string;
  percentage?: number;
}

export interface MediaServiceAdapter {
  createTask: (
    params: any,
    mediaType: MediaType
  ) => Promise<Task>;
  
  checkTaskStatus: (
    taskId: string,
    mediaType: MediaType
  ) => Promise<Task>;
  
  cancelTask: (
    taskId: string,
    mediaType: MediaType
  ) => Promise<boolean>;
}

// This is a placeholder to fix the import in useUnifiedMediaGeneration.ts
export const useMediaServiceAdapter = (options: any) => {
  return {
    generateMedia: (type: string, prompt: string, model: string, params: any, referenceUrl?: string) => {
      console.log('generateMedia called with', { type, prompt, model, params, referenceUrl });
      return 'mock-task-id';
    },
    getTaskStatus: (taskId: string) => {
      console.log('getTaskStatus called with', taskId);
      return {
        id: taskId,
        status: 'pending',
        metadata: {}
      };
    },
    cancelTask: (taskId: string) => {
      console.log('cancelTask called with', taskId);
      return true;
    },
    configureApiKey: (key: string) => {
      console.log('configureApiKey called with', key);
      return true;
    },
    isApiKeyConfigured: () => {
      console.log('isApiKeyConfigured called');
      return true;
    }
  };
};

export const mapTaskStatus = (apiTaskStatus: string): Task['status'] => {
  switch (apiTaskStatus.toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'finished':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
};

export const cancelTask = async (taskId: string, type: MediaType): Promise<boolean> => {
  try {
    console.log(`[mediaServiceAdapter] Canceling ${type} task ${taskId}`);
    
    if (!taskId) {
      console.error('[mediaServiceAdapter] No taskId provided for cancelTask');
      return false;
    }
    
    if (type === 'audio' || type === 'music') {
      return await sunoService.cancelTask(taskId);
    }
    
    // For other media types, handle accordingly (other services would go here)
    console.error(`[mediaServiceAdapter] Unsupported media type for cancellation: ${type}`);
    return false;
  } catch (err) {
    console.error('[mediaServiceAdapter] Error canceling task:', err);
    return false;
  }
};
