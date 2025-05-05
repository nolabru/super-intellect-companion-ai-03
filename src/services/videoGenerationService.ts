
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Type definitions for Video Generation service
 */
export type VideoModel = 
  'kling-text' | 
  'kling-image';

export type VideoGenerationType = 'text-to-video' | 'image-to-video';

export interface VideoGenerationParams {
  prompt: string;
  model: VideoModel;
  duration?: number;
  resolution?: '540p' | '720p' | '1080p' | '4k';
  videoType?: VideoGenerationType;
  imageUrl?: string;
  aspectRatio?: string;
  klingModel?: string;
  klingMode?: string;
  additionalParams?: Record<string, any>;
}

export interface VideoTaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  mediaUrl?: string;
  error?: string;
}

/**
 * Video Generation Service for API Frame's Kling AI
 */
export const videoGenerationService = {
  /**
   * Generate a video using one of the supported Kling models
   */
  async generateVideo(params: VideoGenerationParams): Promise<VideoTaskResult> {
    try {
      const { prompt, model, imageUrl, videoType = 'text-to-video', ...otherParams } = params;
      
      console.log(`[videoGenerationService] Initiating video generation with model ${model}`);
      console.log(`[videoGenerationService] Parameters:`, params);
      
      // Input validation
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty for video generation');
      }
      
      // Check if an image URL is required and provided for image-to-video models
      if (videoType === 'image-to-video' && !imageUrl) {
        throw new Error('Image URL is required for image-to-video generation');
      }
      
      // Call directly to the video-generation edge function, bypassing ai-chat
      const { data, error } = await supabase.functions.invoke('video-generation', {
        body: {
          prompt,
          model,
          imageUrl,
          videoType,
          ...otherParams
        }
      });
      
      if (error) {
        console.error('[videoGenerationService] Error creating video task:', error);
        throw new Error(`Error creating task: ${error.message}`);
      }
      
      if (!data || !data.taskId) {
        throw new Error('Invalid response from the server');
      }
      
      return {
        taskId: data.taskId,
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl,
        error: data.error
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[videoGenerationService] Video generation error:', errorMessage);
      toast.error('Error generating video', { 
        description: errorMessage 
      });
      
      throw error;
    }
  },
  
  /**
   * Check the status of a video generation task
   */
  async checkTaskStatus(taskId: string): Promise<VideoTaskResult> {
    try {
      console.log(`[videoGenerationService] Checking status for task: ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke('video-task-status', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[videoGenerationService] Error checking task status:', error);
        throw new Error(`Error checking status: ${error.message}`);
      }
      
      return {
        taskId: data.taskId || taskId,
        status: data.status || 'pending',
        progress: data.progress || 0,
        mediaUrl: data.mediaUrl,
        error: data.error
      };
    } catch (error) {
      console.error('[videoGenerationService] Error checking task status:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a video generation task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[videoGenerationService] Cancelling task: ${taskId}`);
      
      // Note: Currently, API Frame doesn't support cancelling tasks.
      // This is a placeholder for future implementation.
      toast.info('Cancelling video tasks is not currently supported', {
        description: 'Task will continue until completion.'
      });
      
      return false;
    } catch (error) {
      console.error('[videoGenerationService] Error cancelling task:', error);
      toast.error('Error cancelling task', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },
  
  /**
   * Subscribe to real-time updates for video generation tasks
   */
  subscribeToTaskUpdates(callback: (payload: any) => void): () => void {
    console.log(`[videoGenerationService] Setting up subscription for video task updates`);
    
    const subscription = supabase
      .channel('video-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_ready_events',
          filter: `media_type=eq.video`
        },
        (payload) => {
          console.log(`[videoGenerationService] Received video ready event:`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`[videoGenerationService] Subscription status: ${status}`);
      });
    
    return () => {
      console.log(`[videoGenerationService] Removing subscription for video task updates`);
      supabase.removeChannel(subscription);
    };
  }
};
