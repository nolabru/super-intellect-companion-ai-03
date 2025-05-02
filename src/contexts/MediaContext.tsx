
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface MediaTask {
  id: string;
  type: 'image' | 'video' | 'audio';
  model: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  mediaUrl?: string;
  error?: string;
}

interface MediaContextState {
  tasks: Record<string, MediaTask>;
  recentTasks: string[];
}

interface MediaContextValue {
  state: MediaContextState;
  selectedMedia: string | null;
  setSelectedMedia: (url: string | null) => void;
  clearTask: (taskId: string) => void;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [state, setState] = useState<MediaContextState>({
    tasks: {},
    recentTasks: []
  });

  const clearTask = (taskId: string) => {
    setState(prev => {
      const { [taskId]: _, ...restTasks } = prev.tasks;
      return {
        ...prev,
        tasks: restTasks,
        recentTasks: prev.recentTasks.filter(id => id !== taskId)
      };
    });
  };

  return (
    <MediaContext.Provider value={{ selectedMedia, setSelectedMedia, state, clearTask }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = (): { selectedMedia: string | null; setSelectedMedia: (url: string | null) => void } => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return {
    selectedMedia: context.selectedMedia,
    setSelectedMedia: context.setSelectedMedia
  };
};

export const useMediaContext = (): MediaContextValue => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
