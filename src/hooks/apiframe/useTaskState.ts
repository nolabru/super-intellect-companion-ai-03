
import { useState, useCallback } from 'react';

export interface Task {
  taskId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

export function useTaskState() {
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const registerTask = useCallback((taskId: string, task: Task) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: task
    }));
    setCurrentTaskId(taskId);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      if (!prev[taskId]) return prev;
      
      return {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          ...updates
        }
      };
    });
  }, []);

  const clearTasks = useCallback(() => {
    setTasks({});
    setCurrentTaskId(null);
  }, []);

  const currentTask = currentTaskId ? tasks[currentTaskId] : null;

  return {
    tasks,
    currentTaskId,
    currentTask,
    registerTask,
    updateTask,
    clearTasks
  };
}
