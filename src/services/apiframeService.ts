import { supabase } from '@/integrations/supabase/client';
import { ApiframeMediaType, ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';

export const apiframeService = {
  async generateImage(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {}
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-image', {
        body: { prompt, model, params }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[apiframeService] Error generating image:', err);
      throw err;
    }
  },

  async generateVideo(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-video', {
        body: { prompt, model, params, referenceUrl }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[apiframeService] Error generating video:', err);
      throw err;
    }
  },

  async generateAudio(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-audio', {
        body: { prompt, model, params, referenceUrl }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[apiframeService] Error generating audio:', err);
      throw err;
    }
  },

  async checkTaskStatus(taskId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[apiframeService] Error checking task status:', err);
      throw err;
    }
  },

  async cancelTask(taskId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { taskId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[apiframeService] Error cancelling task:', err);
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

  isApiKeyConfigured(): boolean {
    // We'll implement this later when we add API key management
    return true;
  },

  setApiKey(apiKey: string): boolean {
    // We'll implement this later when we add API key management
    return true;
  }
};
