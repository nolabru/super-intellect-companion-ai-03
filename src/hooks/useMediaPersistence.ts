
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MediaTask, useMediaContext } from '@/contexts/MediaContext';
import { Task } from '@/hooks/apiframe/useTaskState';

/**
 * Hook for persisting media tasks across pages and sessions
 */
export function useMediaPersistence() {
  const { state, registerTask, updateTask, setCurrentTask, clearTask } = useMediaContext();

  /**
   * Register a new media task and return the task ID
   */
  const persistTask = (
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    taskId: string,
    parameters?: Record<string, any>,
    referenceUrl?: string
  ): string => {
    const id = uuidv4();
    
    const task: MediaTask = {
      id,
      taskId,
      type,
      status: 'pending',
      progress: 0,
      prompt,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parameters,
      referenceUrl
    };
    
    registerTask(task);
    
    return id;
  };
  
  /**
   * Update a media task with new information
   */
  const updatePersistedTask = (
    id: string, 
    updates: Partial<MediaTask>
  ): void => {
    updateTask(id, updates);
  };
  
  /**
   * Update a task based on its task manager status
   */
  const updateTaskFromStatus = (
    id: string,
    taskStatus: Task
  ): void => {
    if (!id || !taskStatus) return;
    
    const updates: Partial<MediaTask> = {
      status: taskStatus.status,
      progress: taskStatus.progress || 0
    };
    
    if (taskStatus.mediaUrl) {
      updates.mediaUrl = taskStatus.mediaUrl;
    }
    
    if (taskStatus.error) {
      updates.error = taskStatus.error;
    }
    
    updateTask(id, updates);
  };
  
  /**
   * Get all persisted tasks
   */
  const getAllPersistedTasks = (): Record<string, MediaTask> => {
    return { ...state.tasks };
  };
  
  /**
   * Get a specific persisted task
   */
  const getPersistedTask = (id: string): MediaTask | null => {
    return state.tasks[id] || null;
  };
  
  /**
   * Get the current task
   */
  const getCurrentTask = (): MediaTask | null => {
    return state.currentTaskId ? state.tasks[state.currentTaskId] : null;
  };
  
  /**
   * Get recent tasks
   */
  const getRecentTasks = (limit: number = 10): MediaTask[] => {
    return state.recentTasks
      .slice(0, limit)
      .map(id => state.tasks[id])
      .filter(Boolean);
  };
  
  return {
    persistTask,
    updatePersistedTask,
    updateTaskFromStatus,
    getAllPersistedTasks,
    getPersistedTask,
    getCurrentTask,
    getRecentTasks,
    setCurrentTask,
    clearTask
  };
}
