
import { ApiframeMediaType, ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';
import { supabase } from '@/integrations/supabase/client';
import { getCircuitBreaker, CircuitState } from '@/utils/circuitBreaker';
import { toast } from 'sonner';

let apiKey: string | null = null;

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
    if (!key || key.trim() === '') {
      console.error('[apiframeService] Invalid API key provided');
      return false;
    }
    
    apiKey = key;
    try {
      // Store securely in localStorage for persistence across sessions
      localStorage.setItem('apiframe_api_key', key);
      
      // Reset circuit breakers when API key is changed
      imageCircuitBreaker.reset();
      videoCircuitBreaker.reset();
      audioCircuitBreaker.reset();
      statusCircuitBreaker.reset();
      
      return true;
    } catch (err) {
      console.error('[apiframeService] Error storing API key:', err);
      return false;
    }
  },
  
  isApiKeyConfigured(): boolean {
    // Try to load from localStorage if not in memory
    if (!apiKey) {
      try {
        apiKey = localStorage.getItem('apiframe_api_key');
      } catch (err) {
        console.error('[apiframeService] Error loading API key from localStorage:', err);
      }
    }
    return apiKey !== null && apiKey.trim() !== '';
  },
  
  async generateImage(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {}
  ): Promise<{ taskId: string; status: string; mediaUrl?: string; error?: string }> {
    try {
      console.log(`[apiframeService] Generating image with model ${model} and prompt: ${prompt}`);
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      return await imageCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-image', {
          body: { 
            prompt, 
            model, 
            params,
            apiKey 
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
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      return await videoCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-video', {
          body: { 
            prompt, 
            model, 
            params,
            apiKey,
            referenceImageUrl 
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
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      return await audioCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-generate-audio', {
          body: { 
            prompt, 
            model, 
            params,
            apiKey,
            referenceUrl 
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
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      return await statusCircuitBreaker.execute(async () => {
        const { data, error } = await supabase.functions.invoke('apiframe-check-status', {
          body: { 
            taskId,
            apiKey 
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
      
      if (!this.isApiKeyConfigured()) {
        throw new Error('API key not configured');
      }
      
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { 
          taskId,
          apiKey 
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

// Initialize API key from localStorage on module load
try {
  const storedKey = localStorage.getItem('apiframe_api_key');
  if (storedKey) {
    apiKey = storedKey;
  }
} catch (err) {
  console.error('[apiframeService] Error loading API key from localStorage:', err);
}
