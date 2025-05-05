
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Task {
  id: string;
  type: 'image' | 'video' | 'audio';
  model: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  progress: number;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function useTaskManager(options: {
  showToasts?: boolean;
  maxConcurrentTasks?: number;
  onTaskComplete?: (task: Task) => void;
  onTaskFail?: (task: Task) => void;
  onTaskStart?: (task: Task) => void;
} = {}) {
  const {
    showToasts = true,
    maxConcurrentTasks = 2,
    onTaskComplete,
    onTaskFail,
    onTaskStart
  } = options;

  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  // Create a new task
  const createTask = useCallback((
    type: 'image' | 'video' | 'audio',
    model: string,
    prompt: string,
    metadata?: Record<string, any>
  ): string => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: Task = {
      id,
      type,
      model,
      prompt,
      status: 'pending',
      progress: 0,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTasks(prev => ({
      ...prev,
      [id]: newTask
    }));
    
    if (activeTasks.length < maxConcurrentTasks) {
      setActiveTasks(prev => [...prev, id]);
      
      if (onTaskStart) {
        onTaskStart(newTask);
      }
      
      if (showToasts) {
        toast.info(`Starting ${type} generation task`);
      }
    } else {
      setQueue(prev => [...prev, id]);
      
      if (showToasts) {
        toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} task queued`);
      }
    }
    
    return id;
  }, [activeTasks, maxConcurrentTasks, onTaskStart, showToasts]);

  // Update an existing task
  const updateTask = useCallback((
    id: string,
    updates: Partial<Task>
  ) => {
    setTasks(prev => {
      if (!prev[id]) return prev;
      
      const updatedTask = {
        ...prev[id],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Handle task completion
      if (updates.status === 'completed' && prev[id].status !== 'completed') {
        if (onTaskComplete) {
          onTaskComplete(updatedTask);
        }
        
        if (showToasts) {
          toast.success(`${updatedTask.type.charAt(0).toUpperCase() + updatedTask.type.slice(1)} generated successfully`);
        }
        
        // Process next task in queue
        setTimeout(() => {
          setActiveTasks(active => active.filter(taskId => taskId !== id));
          
          if (queue.length > 0) {
            const nextTaskId = queue[0];
            setQueue(q => q.slice(1));
            setActiveTasks(active => [...active, nextTaskId]);
            
            const nextTask = prev[nextTaskId];
            if (onTaskStart && nextTask) {
              onTaskStart(nextTask);
            }
          }
        }, 0);
      }
      
      // Handle task failure
      if ((updates.status === 'failed' || updates.status === 'canceled') && 
          prev[id].status !== 'failed' && prev[id].status !== 'canceled') {
        if (onTaskFail) {
          onTaskFail(updatedTask);
        }
        
        if (updates.status === 'failed' && showToasts) {
          toast.error(`${updatedTask.type.charAt(0).toUpperCase() + updatedTask.type.slice(1)} generation failed`, {
            description: updates.error || 'Unknown error'
          });
        }
        
        // Process next task in queue
        setTimeout(() => {
          setActiveTasks(active => active.filter(taskId => taskId !== id));
          
          if (queue.length > 0) {
            const nextTaskId = queue[0];
            setQueue(q => q.slice(1));
            setActiveTasks(active => [...active, nextTaskId]);
            
            const nextTask = prev[nextTaskId];
            if (onTaskStart && nextTask) {
              onTaskStart(nextTask);
            }
          }
        }, 0);
      }
      
      return {
        ...prev,
        [id]: updatedTask
      };
    });
  }, [onTaskComplete, onTaskFail, onTaskStart, queue, showToasts]);

  // Cancel a task
  const cancelTask = useCallback((id: string): boolean => {
    const task = tasks[id];
    if (!task) return false;
    
    if (task.status === 'pending' || task.status === 'processing') {
      updateTask(id, { status: 'canceled', error: 'Task canceled by user' });
      return true;
    }
    
    return false;
  }, [tasks, updateTask]);

  // Register a task processor function
  const processors = useState<Record<string, (task: Task) => Promise<Task>>>({});
  const registerTaskProcessor = useCallback((
    type: 'image' | 'video' | 'audio',
    processorFn: (task: Task) => Promise<Task>
  ) => {
    processors[0][type] = processorFn;
  }, [processors]);

  // Get a task by ID
  const getTask = useCallback((id: string): Task | null => {
    return tasks[id] || null;
  }, [tasks]);

  return {
    tasks,
    activeTasks,
    queue,
    createTask,
    updateTask,
    cancelTask,
    registerTaskProcessor,
    getTask
  };
}
