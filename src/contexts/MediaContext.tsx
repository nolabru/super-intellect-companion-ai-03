import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ApiframeMediaType, MediaGenerationResult } from '@/types/apiframeGeneration';

// Define the Media Task structure
export interface MediaTask {
  id: string;
  taskId: string;
  type: 'image' | 'video' | 'audio';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  progress: number;
  prompt: string;
  model: string;
  mediaUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  parameters?: Record<string, any>;
  referenceUrl?: string;
}

// Define the Media Context state
interface MediaState {
  tasks: Record<string, MediaTask>;
  currentTaskId?: string;
  recentTasks: string[]; // Array of task IDs sorted by most recent
}

// Define action types
type MediaAction = 
  | { type: 'REGISTER_TASK'; task: MediaTask }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<MediaTask> }
  | { type: 'SET_CURRENT_TASK'; taskId?: string }
  | { type: 'CLEAR_TASK'; taskId: string }
  | { type: 'LOAD_STATE'; state: MediaState }
  | { type: 'CLEAR_ALL_TASKS' };

// Initial state
const initialState: MediaState = {
  tasks: {},
  currentTaskId: undefined,
  recentTasks: []
};

// Create context
const MediaContext = createContext<{
  state: MediaState;
  registerTask: (task: MediaTask) => void;
  updateTask: (taskId: string, updates: Partial<MediaTask>) => void;
  setCurrentTask: (taskId?: string) => void;
  clearTask: (taskId: string) => void;
  clearAllTasks: () => void;
} | undefined>(undefined);

// Define the reducer
function mediaReducer(state: MediaState, action: MediaAction): MediaState {
  switch (action.type) {
    case 'REGISTER_TASK': {
      const updatedTasks = {
        ...state.tasks,
        [action.task.id]: action.task
      };
      
      // Add to recent tasks and keep only the 20 most recent
      const recentTasks = [action.task.id, ...state.recentTasks.filter(id => id !== action.task.id)].slice(0, 20);
      
      return {
        ...state,
        tasks: updatedTasks,
        currentTaskId: state.currentTaskId || action.task.id,
        recentTasks
      };
    }
    
    case 'UPDATE_TASK': {
      if (!state.tasks[action.taskId]) {
        return state;
      }
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.taskId]: {
            ...state.tasks[action.taskId],
            ...action.updates,
            updatedAt: new Date().toISOString()
          }
        }
      };
    }
    
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTaskId: action.taskId
      };
      
    case 'CLEAR_TASK': {
      const { [action.taskId]: removed, ...remainingTasks } = state.tasks;
      return {
        ...state,
        tasks: remainingTasks,
        currentTaskId: state.currentTaskId === action.taskId ? undefined : state.currentTaskId,
        recentTasks: state.recentTasks.filter(id => id !== action.taskId)
      };
    }
    
    case 'LOAD_STATE':
      return action.state;
      
    case 'CLEAR_ALL_TASKS':
      return {
        ...state,
        tasks: {},
        currentTaskId: undefined,
        recentTasks: []
      };
      
    default:
      return state;
  }
}

// Local storage keys
const MEDIA_STATE_KEY = 'media_state';

// Provider component
export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mediaReducer, initialState);
  
  // Load state from localStorage when component mounts
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(MEDIA_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', state: parsedState });
      }
    } catch (error) {
      console.error('Failed to load media state from localStorage:', error);
    }
  }, []);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(MEDIA_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save media state to localStorage:', error);
    }
  }, [state]);
  
  // Actions
  const registerTask = (task: MediaTask) => {
    dispatch({ type: 'REGISTER_TASK', task });
  };
  
  const updateTask = (taskId: string, updates: Partial<MediaTask>) => {
    dispatch({ type: 'UPDATE_TASK', taskId, updates });
  };
  
  const setCurrentTask = (taskId?: string) => {
    dispatch({ type: 'SET_CURRENT_TASK', taskId });
  };
  
  const clearTask = (taskId: string) => {
    dispatch({ type: 'CLEAR_TASK', taskId });
  };
  
  const clearAllTasks = () => {
    dispatch({ type: 'CLEAR_ALL_TASKS' });
  };
  
  const value = {
    state,
    registerTask,
    updateTask,
    setCurrentTask,
    clearTask,
    clearAllTasks
  };
  
  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}

// Custom hook to use the context
export function useMediaContext() {
  const context = useContext(MediaContext);
  
  if (context === undefined) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  
  return context;
}
