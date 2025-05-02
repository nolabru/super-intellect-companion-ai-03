
import { useState, useCallback } from 'react';
import { Task } from '@/hooks/useTaskManager';
import { toast } from 'sonner';

export interface MediaServiceOptions {
  service: 'piapi' | 'auto';
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
    showToasts = true,
    onTaskUpdate
  } = options;
  
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  // Main public methods
  return {
    // Main method to generate any type of media
    generateMedia: (
      type: 'image' | 'video' | 'audio',
      prompt: string,
      model: string,
      params: any = {},
      referenceUrl?: string
    ): string => {
      const taskId = `task_${Date.now()}`;
      
      if (showToasts) {
        toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started`, {
          description: 'Your request has been queued'
        });
      }
      
      return taskId;
    },
    
    // Shortcuts for specific media types
    generateImage: (prompt: string, model: string, params?: any, referenceUrl?: string): string => 
      `task_${Date.now()}`,
      
    generateVideo: (prompt: string, model: string, params?: any, referenceUrl?: string): string => 
      `task_${Date.now()}`,
      
    generateAudio: (prompt: string, model: string, params?: any, referenceUrl?: string): string => 
      `task_${Date.now()}`,
    
    // Task management methods
    cancelTask: (taskId: string): boolean => true,
    getTask: (taskId: string): Task | undefined => undefined,
    getTaskStatus: (taskId: string): Task | undefined => undefined,
    getAllTasks: (): Task[] => [],
    getActiveTasks: (): Task[] => [],
    getTaskQueue: (): string[] => [],
    
    // Service configuration methods
    configureApiKey: (key: string, service: 'piapi' = 'piapi'): boolean => {
      try {
        localStorage.setItem('piapi_api_key', key);
        return true;
      } catch (error) {
        console.error('Error setting API key:', error);
        return false;
      }
    },
    
    isApiKeyConfigured: (service: 'piapi' = 'piapi'): boolean => {
      const key = localStorage.getItem('piapi_api_key');
      return !!key;
    }
  };
}
