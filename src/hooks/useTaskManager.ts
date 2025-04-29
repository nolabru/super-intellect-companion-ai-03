
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface Task {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  model: string;
  prompt: string;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TaskManagerOptions {
  showToasts?: boolean;
  maxConcurrentTasks?: number;
  maxTaskHistory?: number;
  onTaskComplete?: (task: Task) => void;
  onTaskFail?: (task: Task) => void;
  onTaskStart?: (task: Task) => void;
}

/**
 * Centralized task management system for all asynchronous operations
 */
export function useTaskManager(options: TaskManagerOptions = {}) {
  const {
    showToasts = true,
    maxConcurrentTasks = 1,
    maxTaskHistory = 50,
    onTaskComplete,
    onTaskFail,
    onTaskStart
  } = options;

  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  const [queue, setQueue] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const taskProcessors = useRef<Record<string, (task: Task) => Promise<Task>>>({});

  /**
   * Register a task processor for a specific task type
   */
  const registerTaskProcessor = useCallback((
    taskType: Task['type'],
    processor: (task: Task) => Promise<Task>
  ) => {
    taskProcessors.current[taskType] = processor;
  }, []);

  /**
   * Create a new task and add it to the queue
   */
  const createTask = useCallback((
    type: Task['type'],
    model: string,
    prompt: string,
    metadata?: Record<string, any>
  ): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newTask: Task = {
      id: taskId,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      model,
      prompt,
      metadata
    };
    
    setTasks(prev => ({
      ...prev,
      [taskId]: newTask
    }));
    
    setQueue(prev => [...prev, newTask]);
    
    if (showToasts) {
      toast.info(`Adding ${type} task to queue`, {
        id: `task-queued-${taskId}`
      });
    }
    
    // Start processing the queue if not already processing
    processNextTask();
    
    return taskId;
  }, [showToasts]);
  
  /**
   * Process the next task in the queue
   */
  const processNextTask = useCallback(async () => {
    // If already processing, don't start a new process
    if (isProcessing) return;
    
    // If no tasks in queue or at max concurrent tasks, don't process
    if (queue.length === 0 || activeTasks.length >= maxConcurrentTasks) return;
    
    // Set processing flag
    setIsProcessing(true);
    
    try {
      // Get next task from queue
      const nextTask = queue[0];
      
      // Move from queue to active tasks
      setQueue(prev => prev.slice(1));
      setActiveTasks(prev => [...prev, nextTask.id]);
      
      // Update task status
      updateTask(nextTask.id, {
        status: 'processing',
        progress: 5
      });
      
      if (onTaskStart) {
        onTaskStart(nextTask);
      }
      
      if (showToasts) {
        toast.loading(`Starting ${nextTask.type} task`, {
          id: `task-start-${nextTask.id}`
        });
      }
      
      // Get processor for this task type
      const processor = taskProcessors.current[nextTask.type];
      
      if (!processor) {
        throw new Error(`No processor registered for task type: ${nextTask.type}`);
      }
      
      // Process the task
      const processedTask = await processor(nextTask);
      
      // Update task with result
      updateTask(nextTask.id, {
        status: processedTask.status,
        progress: processedTask.status === 'completed' ? 100 : processedTask.progress,
        result: processedTask.result,
        error: processedTask.error,
        metadata: {
          ...nextTask.metadata,
          ...processedTask.metadata
        }
      });
      
      // Handle result
      if (processedTask.status === 'completed') {
        if (showToasts) {
          toast.success(`${nextTask.type} task completed`, {
            id: `task-complete-${nextTask.id}`
          });
        }
        
        if (onTaskComplete) {
          onTaskComplete(getTask(nextTask.id)!);
        }
      } else {
        if (showToasts) {
          toast.error(`${nextTask.type} task failed`, {
            id: `task-fail-${nextTask.id}`,
            description: processedTask.error || 'Unknown error'
          });
        }
        
        if (onTaskFail) {
          onTaskFail(getTask(nextTask.id)!);
        }
      }
    } catch (error) {
      console.error('[useTaskManager] Error processing task:', error);
    } finally {
      // Remove from active tasks
      setActiveTasks(prev => prev.filter(id => id !== queue[0]?.id));
      
      // Reset processing flag
      setIsProcessing(false);
      
      // Clean up old tasks if we have too many
      cleanupTasks();
      
      // Process next task if available
      processNextTask();
    }
  }, [
    isProcessing, 
    queue, 
    activeTasks, 
    maxConcurrentTasks, 
    onTaskStart, 
    onTaskComplete, 
    onTaskFail, 
    showToasts
  ]);

  /**
   * Update a task's properties
   */
  const updateTask = useCallback((
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt'>>
  ) => {
    setTasks(prev => {
      if (!prev[taskId]) return prev;
      
      return {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          ...updates,
          updatedAt: new Date()
        }
      };
    });
  }, []);

  /**
   * Get a task by ID
   */
  const getTask = useCallback((taskId: string): Task | undefined => {
    return tasks[taskId];
  }, [tasks]);

  /**
   * Cancel a task
   */
  const cancelTask = useCallback((taskId: string): boolean => {
    const task = tasks[taskId];
    
    if (!task) return false;
    
    // If task is in queue, remove it
    if (task.status === 'pending') {
      setQueue(prev => prev.filter(t => t.id !== taskId));
    }
    
    // Update task status
    updateTask(taskId, {
      status: 'canceled',
      progress: 0,
      error: 'Canceled by user'
    });
    
    // Remove from active tasks
    setActiveTasks(prev => prev.filter(id => id !== taskId));
    
    if (showToasts) {
      toast.info(`${task.type} task canceled`, {
        id: `task-cancel-${taskId}`
      });
    }
    
    return true;
  }, [tasks, showToasts, updateTask]);

  /**
   * Clean up old tasks to prevent memory leaks
   */
  const cleanupTasks = useCallback(() => {
    setTasks(prev => {
      const taskIds = Object.keys(prev);
      
      // If we don't have too many tasks, don't clean up
      if (taskIds.length <= maxTaskHistory) return prev;
      
      // Sort tasks by updated time (oldest first)
      const sortedIds = taskIds.sort((a, b) => 
        prev[a].updatedAt.getTime() - prev[b].updatedAt.getTime()
      );
      
      // Get tasks to remove
      const idsToRemove = sortedIds.slice(0, taskIds.length - maxTaskHistory);
      
      // Create new tasks object without removed tasks
      const newTasks = { ...prev };
      idsToRemove.forEach(id => {
        delete newTasks[id];
      });
      
      return newTasks;
    });
  }, [maxTaskHistory]);
  
  return {
    tasks,
    activeTasks,
    queue,
    createTask,
    updateTask,
    getTask,
    cancelTask,
    registerTaskProcessor,
    isProcessing
  };
}
