
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MediaTask {
  id: string;
  type: 'image' | 'video' | 'audio';
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
  createdAt: Date;
}

export interface MediaContextType {
  tasks: MediaTask[];
  state: { tasks: Record<string, MediaTask>, recentTasks: string[] };
  addTask: (task: MediaTask) => void;
  updateTask: (id: string, updates: Partial<MediaTask>) => void;
  removeTask: (id: string) => void;
  clearTask: (id: string) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<MediaTask[]>([]);
  const [state, setState] = useState<{ tasks: Record<string, MediaTask>, recentTasks: string[] }>({
    tasks: {},
    recentTasks: []
  });
  
  const addTask = (task: MediaTask) => {
    setTasks(prev => [...prev, task]);
    setState(prev => ({
      tasks: { ...prev.tasks, [task.id]: task },
      recentTasks: [task.id, ...prev.recentTasks].slice(0, 10)
    }));
  };
  
  const updateTask = (id: string, updates: Partial<MediaTask>) => {
    setTasks(prev => 
      prev.map(task => task.id === id ? { ...task, ...updates } : task)
    );
    setState(prev => {
      if (!prev.tasks[id]) return prev;
      return {
        ...prev,
        tasks: { ...prev.tasks, [id]: { ...prev.tasks[id], ...updates } }
      };
    });
  };
  
  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setState(prev => {
      const { [id]: _, ...restTasks } = prev.tasks;
      return {
        tasks: restTasks,
        recentTasks: prev.recentTasks.filter(taskId => taskId !== id)
      };
    });
  };
  
  const clearTask = (id: string) => {
    setState(prev => {
      const { [id]: _, ...restTasks } = prev.tasks;
      return {
        tasks: restTasks,
        recentTasks: prev.recentTasks.filter(taskId => taskId !== id)
      };
    });
  };
  
  return (
    <MediaContext.Provider value={{ tasks, state, addTask, updateTask, removeTask, clearTask }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
