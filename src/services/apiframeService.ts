
import { supabase } from '@/integrations/supabase/client';
import { ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';

/**
 * Service for interacting with APIframe API
 */
export const apiframeService = {
  /**
   * Check if API key is configured
   */
  isApiKeyConfigured(): boolean {
    // We're using a server-side API key, so it's always configured
    return true;
  },
  
  /**
   * Set API key (this is a no-op since we're using server-side keys)
   * Added for compatibility with other parts of the application
   */
  setApiKey(apiKey: string): boolean {
    console.log('[apiframeService] setApiKey is a no-op for server-side keys');
    // Always return true since we're using a server-side key
    return true;
  },
  
  /**
   * Test connection to APIframe API
   */
  async testConnection(): Promise<{
    success: boolean;
    endpoint?: string;
    error?: string;
    details?: any;
  }> {
    try {
      const response = await supabase.functions.invoke('apiframe-test-connection');
      
      if (response.error) {
        console.error('[apiframeService] Error testing connection:', response.error);
        return { 
          success: false, 
          error: `Error: ${response.error.message || 'Unknown error'}` 
        };
      }
      
      return response.data;
    } catch (err) {
      console.error('[apiframeService] Error testing connection:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  },
  
  /**
   * Generate image using APIframe
   */
  async generateImage(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {}
  ): Promise<any> {
    try {
      console.log(`[apiframeService] Generating image with model ${model}`);
      
      return await this.generateMedia({
        mediaType: 'image',
        prompt,
        model,
        ...params
      });
    } catch (err) {
      console.error('[apiframeService] Error generating image:', err);
      throw err;
    }
  },
  
  /**
   * Generate video using APIframe
   */
  async generateVideo(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ): Promise<any> {
    try {
      console.log(`[apiframeService] Generating video with model ${model}`);
      
      return await this.generateMedia({
        mediaType: 'video',
        prompt,
        model,
        referenceUrl,
        ...params
      });
    } catch (err) {
      console.error('[apiframeService] Error generating video:', err);
      throw err;
    }
  },
  
  /**
   * Generate audio using APIframe
   */
  async generateAudio(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ): Promise<any> {
    try {
      console.log(`[apiframeService] Generating audio with model ${model}`);
      
      return await this.generateMedia({
        mediaType: 'audio',
        prompt,
        model,
        referenceUrl,
        ...params
      });
    } catch (err) {
      console.error('[apiframeService] Error generating audio:', err);
      throw err;
    }
  },
  
  /**
   * Generate media using APIframe
   */
  async generateMedia(params: any): Promise<any> {
    const { mediaType } = params;
    let functionName = '';
    
    switch (mediaType) {
      case 'image':
        functionName = 'apiframe-generate-image';
        break;
      case 'video':
        functionName = 'apiframe-generate-video';
        break;
      case 'audio':
        functionName = 'apiframe-generate-audio';
        break;
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
    
    try {
      const response = await supabase.functions.invoke(functionName, {
        body: params
      });
      
      if (response.error) {
        console.error(`[apiframeService] Error generating ${mediaType}:`, response.error);
        throw new Error(response.error.message || `Failed to generate ${mediaType}`);
      }
      
      return response.data;
    } catch (err) {
      console.error(`[apiframeService] Error generating ${mediaType}:`, err);
      throw err;
    }
  },
  
  /**
   * Check media generation task status
   */
  async checkTaskStatus(taskId: string): Promise<any> {
    try {
      const response = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (response.error) {
        console.error('[apiframeService] Error checking task status:', response.error);
        throw new Error(response.error.message || 'Failed to check task status');
      }
      
      return response.data;
    } catch (err) {
      console.error('[apiframeService] Error checking task status:', err);
      throw err;
    }
  },
  
  /**
   * Cancel media generation task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const response = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { taskId }
      });
      
      if (response.error) {
        console.error('[apiframeService] Error canceling task:', response.error);
        throw new Error(response.error.message || 'Failed to cancel task');
      }
      
      return response.data.success || false;
    } catch (err) {
      console.error('[apiframeService] Error canceling task:', err);
      throw err;
    }
  },
  
  /**
   * Subscribe to task updates
   */
  subscribeToTaskUpdates(callback: (payload: any) => void) {
    console.log('[apiframeService] Subscribing to task updates');
    
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
  }
};
