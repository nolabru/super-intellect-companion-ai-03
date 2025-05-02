
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
  addTask: (task: MediaTask) => void;
  updateTask: (id: string, updates: Partial<MediaTask>) => void;
  removeTask: (id: string) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<MediaTask[]>([]);
  
  const addTask = (task: MediaTask) => {
    setTasks(prev => [...prev, task]);
  };
  
  const updateTask = (id: string, updates: Partial<MediaTask>) => {
    setTasks(prev => 
      prev.map(task => task.id === id ? { ...task, ...updates } : task)
    );
  };
  
  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };
  
  return (
    <MediaContext.Provider value={{ tasks, addTask, updateTask, removeTask }}>
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
