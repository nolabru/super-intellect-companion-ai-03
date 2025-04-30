import { ApiframeMediaType, ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';
import { supabase } from '@/integrations/supabase/client';
import { getCircuitBreaker, CircuitState } from '@/utils/circuitBreaker';
import { toast } from 'sonner';

// Global flag to indicate that the API key is globally configured on the server
const isGlobalApiKeyConfigured = true;

// Create circuit breakers for each operation type
const imageCircuitBreaker = getCircuitBreaker('apiframe-image', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  onStateChange: (from, to) => {
    if (to === CircuitState.OPEN) {
      toast.warning('Image generation service temporarily unavailable', {
        description: 'Automatic reconnection attempt in 30 seconds',
        duration: 5000
      });
    } else if (from === CircuitState.OPEN && to === CircuitState.CLOSED) {
      toast.success('Image generation service restored', {
        duration: 3000
      });
    }
  }
});

const videoCircuitBreaker = getCircuitBreaker('apiframe-video', {
  failureThreshold: 2, // More sensitive for videos as they're more resource-intensive
  resetTimeout: 45000, // 45 seconds
  onStateChange: (from, to) => {
    if (to === CircuitState.OPEN) {
      toast.warning('Video generation service temporarily unavailable', {
        description: 'Automatic reconnection attempt in 45 seconds',
        duration: 5000
      });
    } else if (from === CircuitState.OPEN && to === CircuitState.CLOSED) {
      toast.success('Video generation service restored', {
        duration: 3000
      });
    }
  }
});

const audioCircuitBreaker = getCircuitBreaker('apiframe-audio', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  onStateChange: (from, to) => {
    if (to === CircuitState.OPEN) {
      toast.warning('Audio generation service temporarily unavailable', {
        description: 'Automatic reconnection attempt in 30 seconds',
        duration: 5000
      });
    } else if (from === CircuitState.OPEN && to === CircuitState.CLOSED) {
      toast.success('Audio generation service restored', {
        duration: 3000
      });
    }
  }
});

const statusCircuitBreaker = getCircuitBreaker('apiframe-status', {
  failureThreshold: 5, // More tolerant for status checks
  resetTimeout: 20000 // 20 seconds
});

export const apiframeService = {
  setApiKey(key: string): boolean {
    // We don't need to store the API key anymore since we're using a global key
    // But we'll keep this method for backward compatibility
    return true;
  },
  
  isApiKeyConfigured(): boolean {
    // Always return true since we're using a global API key
    return isGlobalApiKeyConfigured;
  },
  
  async generateImage(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {}
  ): Promise<{ taskId: string; status: string; mediaUrl?: string; error?: string }> {
    try {
      console.log(`[apiframeService] Generating image with model ${model} and prompt: ${prompt}`);
      
      // No need to check if API key is configured since we're using a global key
      return await imageCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-image', {
          body: { 
            prompt, 
            model, 
            params
            // No longer sending API key in the request body
          }
        });
        
        if (error || !data) {
          console.error('[apiframeService] Error generating image:', error || 'No data received');
          throw new Error(error?.message || 'Failed to generate image');
        }
        
        return data;
      });
    } catch (err) {
      console.error('[apiframeService] Error in generateImage:', err);
      throw err;
    }
  },
  
  async generateVideo(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceImageUrl?: string
  ): Promise<{ taskId: string; status: string; mediaUrl?: string; error?: string }> {
    try {
      console.log(`[apiframeService] Generating video with model ${model} and prompt: ${prompt}`);
      
      // No need to check if API key is configured since we're using a global key
      return await videoCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-video', {
          body: { 
            prompt, 
            model, 
            params,
            referenceImageUrl 
            // No longer sending API key in the request body
          }
        });
        
        if (error || !data) {
          console.error('[apiframeService] Error generating video:', error || 'No data received');
          throw new Error(error?.message || 'Failed to generate video');
        }
        
        return data;
      });
    } catch (err) {
      console.error('[apiframeService] Error in generateVideo:', err);
      throw err;
    }
  },
  
  async generateAudio(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ): Promise<{ taskId: string; status: string; mediaUrl?: string; error?: string }> {
    try {
      console.log(`[apiframeService] Generating audio with model ${model} and prompt: ${prompt}`);
      
      // No need to check if API key is configured since we're using a global key
      return await audioCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-audio', {
          body: { 
            prompt, 
            model, 
            params,
            referenceUrl 
            // No longer sending API key in the request body
          }
        });
        
        if (error || !data) {
          console.error('[apiframeService] Error generating audio:', error || 'No data received');
          throw new Error(error?.message || 'Failed to generate audio');
        }
        
        return data;
      });
    } catch (err) {
      console.error('[apiframeService] Error in generateAudio:', err);
      throw err;
    }
  },
  
  async checkTaskStatus(taskId: string): Promise<{ status: string; mediaUrl?: string; error?: string; taskId?: string }> {
    try {
      console.log(`[apiframeService] Checking status for task ${taskId}`);
      
      // No need to check if API key is configured since we're using a global key
      return await statusCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-check-status', {
          body: { 
            taskId
            // No longer sending API key in the request body
          }
        });
        
        if (error || !data) {
          console.error('[apiframeService] Error checking task status:', error || 'No data received');
          throw new Error(error?.message || 'Failed to check task status');
        }
        
        return {
          ...data,
          taskId
        };
      });
    } catch (err) {
      console.error('[apiframeService] Error in checkTaskStatus:', err);
      throw err;
    }
  },
  
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[apiframeService] Cancelling task ${taskId}`);
      
      // No need to check if API key is configured since we're using a global key
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { 
          taskId
          // No longer sending API key in the request body
        }
      });
      
      if (error || !data) {
        console.error('[apiframeService] Error cancelling task:', error || 'No data received');
        throw new Error(error?.message || 'Failed to cancel task');
      }
      
      return data.success || false;
    } catch (err) {
      console.error('[apiframeService] Error in cancelTask:', err);
      throw err;
    }
  },
  
  subscribeToTaskUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('media-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_ready_events'
        },
        callback
      )
      .subscribe();
  },
  
  // Methods to get circuit breaker state
  getCircuitState(type: 'image' | 'video' | 'audio' | 'status'): CircuitState {
    switch (type) {
      case 'image': return imageCircuitBreaker.getState();
      case 'video': return videoCircuitBreaker.getState();
      case 'audio': return audioCircuitBreaker.getState();
      case 'status': return statusCircuitBreaker.getState();
    }
  },
  
  // Method to manually reset circuit breakers
  resetCircuitBreakers(): void {
    imageCircuitBreaker.reset();
    videoCircuitBreaker.reset();
    audioCircuitBreaker.reset();
    statusCircuitBreaker.reset();
    console.log('[apiframeService] All circuit breakers have been reset');
  }
};
