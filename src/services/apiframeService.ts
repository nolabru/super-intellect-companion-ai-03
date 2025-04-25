
import { supabase } from '@/integrations/supabase/client';
import { ApiframeMediaType, ApiframeModel, ApiframeParams, MediaGenerationResult } from '@/types/apiframeGeneration';

/**
 * Core service for interacting with APIframe.ai
 */
export class ApiframeService {
  private apiKey: string | null = null;
  private readonly API_ENDPOINT = 'https://api.apiframe.ai/v1';
  
  constructor() {
    // Try to initialize from localStorage if available
    this.apiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('APIFRAME_API_KEY') 
      : null;
    
    console.log(`[ApiframeService] Initialized with API key: ${this.apiKey ? 'Available' : 'Not available'}`);
  }

  /**
   * Check if API key is configured
   */
  public isApiKeyConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Configure API key
   */
  public setApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') {
      console.error('[ApiframeService] Invalid API key provided');
      return false;
    }

    this.apiKey = apiKey.trim();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('APIFRAME_API_KEY', this.apiKey);
    }
    
    console.log('[ApiframeService] API key configured successfully');
    return true;
  }

  /**
   * Generate image through APIframe.ai
   */
  public async generateImage(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {}
  ): Promise<MediaGenerationResult> {
    console.log(`[ApiframeService] Generating image with model: ${model}`);
    
    try {
      const taskId = await this.createEdgeTask('image', {
        prompt,
        model,
        params
      });
      
      return {
        success: true,
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error('[ApiframeService] Error generating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate video through APIframe.ai
   */
  public async generateVideo(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceImageUrl?: string
  ): Promise<MediaGenerationResult> {
    console.log(`[ApiframeService] Generating video with model: ${model}`);
    
    try {
      const taskId = await this.createEdgeTask('video', {
        prompt,
        model,
        params,
        referenceImageUrl
      });
      
      return {
        success: true,
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error('[ApiframeService] Error generating video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate audio through APIframe.ai
   */
  public async generateAudio(
    prompt: string,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> {
    console.log(`[ApiframeService] Generating audio with model: ${model}`);
    
    try {
      const taskId = await this.createEdgeTask('audio', {
        prompt,
        model,
        params,
        referenceUrl
      });
      
      return {
        success: true,
        taskId,
        status: 'pending'
      };
    } catch (error) {
      console.error('[ApiframeService] Error generating audio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check task status through edge function
   */
  public async checkTaskStatus(taskId: string): Promise<MediaGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[ApiframeService] Error checking task status:', error);
        throw error;
      }
      
      return {
        success: true,
        taskId: data.taskId,
        status: data.status,
        mediaUrl: data.mediaUrl,
        error: data.error
      };
    } catch (error) {
      console.error('[ApiframeService] Error checking task status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel task through edge function
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[ApiframeService] Error cancelling task:', error);
        throw error;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('[ApiframeService] Error cancelling task:', error);
      return false;
    }
  }

  /**
   * Create a task through edge function
   */
  private async createEdgeTask(
    mediaType: ApiframeMediaType,
    requestData: any
  ): Promise<string> {
    // Create a task through the appropriate edge function
    const functionName = `apiframe-generate-${mediaType}`;
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: requestData
    });
    
    if (error) {
      console.error(`[ApiframeService] Error calling ${functionName}:`, error);
      throw error;
    }
    
    if (!data?.taskId) {
      throw new Error('No task ID returned from APIframe.ai service');
    }
    
    return data.taskId;
  }

  /**
   * Subscribe to task updates via Supabase realtime
   */
  public subscribeToTaskUpdates(
    onUpdate: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel('apiframe-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_ready_events',
        },
        onUpdate
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Create singleton instance
   */
  private static instance: ApiframeService;

  public static getInstance(): ApiframeService {
    if (!ApiframeService.instance) {
      ApiframeService.instance = new ApiframeService();
    }
    return ApiframeService.instance;
  }
}

// Export singleton instance
export const apiframeService = ApiframeService.getInstance();
