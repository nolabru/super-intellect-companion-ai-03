
import { useState, useCallback } from 'react';

export interface GenerationTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  progress: number;
  mediaUrl?: string;
  error?: string;
  [key: string]: any;
}

export function useTaskState() {
  const [tasks, setTasks] = useState<Record<string, GenerationTask>>({});
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const updateTask = useCallback((
    taskId: string, 
    updates: Partial<GenerationTask>
  ) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...updates
      }
    }));
  }, []);

  const registerTask = useCallback((taskId: string, initialTask: GenerationTask) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: initialTask
    }));
    setCurrentTaskId(taskId);
  }, []);

  const clearTasks = useCallback(() => {
    setTasks({});
    setCurrentTaskId(null);
  }, []);

  return {
    tasks,
    currentTaskId,
    currentTask: currentTaskId ? tasks[currentTaskId] : null,
    updateTask,
    registerTask,
    clearTasks
  };
}
