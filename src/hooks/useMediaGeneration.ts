
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { MediaGenerationResult, MediaGenerationParams, MediaGenerationTask, MediaServiceOptions } from '@/types/mediaGeneration';
import { supabase } from '@/integrations/supabase/client';

export function useMediaGeneration(options: MediaServiceOptions = { showToasts: true }) {
  const { showToasts, onTaskUpdate } = options;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<MediaGenerationTask | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  
  // Check if API key is configured
  const isApiKeyConfigured = useCallback(() => {
    const key = localStorage.getItem('piapi_api_key');
    return !!key;
  }, []);
  
  // Configure API key
  const configureApiKey = useCallback((apiKey: string) => {
    if (!apiKey.trim()) return false;
    
    try {
      localStorage.setItem('piapi_api_key', apiKey);
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }, []);
  
  // Generate media using PiAPI
  const generateMedia = useCallback(async (
    prompt: string, 
    mediaType: 'image' | 'video' | 'audio', 
    modelId: string, 
    params: MediaGenerationParams = {}, 
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    if (!isApiKeyConfigured()) {
      if (showToasts) toast.error('PiAPI key not configured');
      return { success: false, error: 'API key not configured' };
    }
    
    setIsGenerating(true);
    
    try {
      // Create task endpoint mapping based on media type
      const endpoint = mediaType === 'image' ? 'piapi-image-create-task' :
                       mediaType === 'video' ? 'piapi-video-create-task' : 
                       'piapi-audio-create-task';
      
      // Call the appropriate Supabase function
      const response = await supabase.functions.invoke(endpoint, {
        body: { prompt, model: modelId, params, referenceUrl }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { taskId, error } = response.data || {};
      
      if (error) {
        throw new Error(error);
      }
      
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }
      
      // Create task object
      const newTask: MediaGenerationTask = {
        taskId,
        type: mediaType,
        status: 'pending',
        prompt,
        model: modelId,
        progress: 0,
        metadata: {
          params,
          referenceUrl
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Set as current task
      setCurrentTask(newTask);
      
      // Start polling for task status
      startPolling(taskId);
      
      return { success: true, taskId };
    } catch (error) {
      console.error(`Error generating ${mediaType}:`, error);
      setIsGenerating(false);
      if (showToasts) {
        toast.error(`Failed to generate ${mediaType}`, {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [isApiKeyConfigured, showToasts]);
  
  // Poll for task status
  const startPolling = useCallback((taskId: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
    }
    
    // Poll every 3 seconds
    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await supabase.functions.invoke('piapi-task-status', {
          body: { taskId }
        });
        
        if (response.error) throw new Error(response.error.message);
        
        const { status, mediaUrl, progress, error } = response.data || {};
        
        setCurrentTask(prev => {
          if (!prev) return null;
          
          const updated = {
            ...prev,
            status: status || prev.status,
            progress: progress || prev.progress,
            mediaUrl: mediaUrl || prev.mediaUrl,
            error: error || prev.error,
            updatedAt: new Date()
          };
          
          // Notify via callback if provided
          if (onTaskUpdate) onTaskUpdate(updated);
          
          return updated;
        });
        
        // If completed, failed or canceled, stop polling
        if (status === 'completed' || status === 'failed' || status === 'canceled') {
          if (pollIntervalRef.current) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          setIsGenerating(status !== 'completed');
          
          if (status === 'completed' && showToasts) {
            toast.success('Generation completed');
          } else if (status === 'failed' && showToasts) {
            toast.error('Generation failed', {
              description: error || 'Unknown error'
            });
          }
        }
      } catch (error) {
        console.error('Error polling task status:', error);
        
        // Stop polling on error
        if (pollIntervalRef.current) {
          window.clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        setIsGenerating(false);
      }
    }, 3000);
  }, [onTaskUpdate, showToasts]);
  
  // Cancel task
  const cancelTask = useCallback(async (taskId: string) => {
    if (!taskId) return false;
    
    try {
      const response = await supabase.functions.invoke('piapi-task-cancel', {
        body: { taskId }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Stop polling
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      setCurrentTask(prev => {
        if (!prev) return null;
        
        const updated = {
          ...prev,
          status: 'canceled',
          updatedAt: new Date()
        };
        
        if (onTaskUpdate) onTaskUpdate(updated);
        
        return updated;
      });
      
      setIsGenerating(false);
      
      return true;
    } catch (error) {
      console.error('Error canceling task:', error);
      if (showToasts) {
        toast.error('Failed to cancel generation', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return false;
    }
  }, [onTaskUpdate, showToasts]);
  
  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);
  
  return {
    // State
    isGenerating,
    currentTask,
    
    // Methods
    generateMedia,
    cancelTask,
    configureApiKey,
    isApiKeyConfigured,
    cleanup
  };
}
