
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiFrameVideoParams {
  duration?: number;
  resolution?: string;
  fps?: number;
  [key: string]: any;
}

export interface VideoGenerationResult {
  success: boolean;
  taskId?: string;
  status?: string;
  message?: string;
  error?: string;
}

/**
 * Service for interacting with API Frame video generation
 */
export const apiFrameVideoService = {
  /**
   * Generate a video using API Frame
   * 
   * @param prompt Text prompt for video generation
   * @param model Model to use (e.g., 'kling-text', 'kling-image')
   * @param params Additional parameters
   * @param referenceImageUrl Optional reference image URL for image-to-video
   * @returns Promise with generation result
   */
  async generateVideo(
    prompt: string,
    model: string = 'kling-text',
    params: ApiFrameVideoParams = {},
    referenceImageUrl?: string
  ): Promise<VideoGenerationResult> {
    try {
      console.log(`[apiFrameVideoService] Generating video with model ${model}`);
      console.log(`[apiFrameVideoService] Prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
      
      const { data, error } = await supabase.functions.invoke('apiframe-video-create-task', {
        body: {
          prompt,
          model,
          imageUrl: referenceImageUrl,
          params
        }
      });

      if (error) {
        console.error(`[apiFrameVideoService] Error creating video task:`, error);
        throw new Error(`Error creating video task: ${error.message || 'Unknown error'}`);
      }

      if (!data || !data.taskId) {
        throw new Error('Failed to start video generation: no task ID returned');
      }

      return {
        success: true,
        taskId: data.taskId,
        status: 'processing',
        message: data.message || `Video generation started with model ${model}`
      };
    } catch (error) {
      console.error(`[apiFrameVideoService] Failed to generate video:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating video'
      };
    }
  },

  /**
   * Check the status of a video generation task
   * 
   * @param taskId Task ID to check
   * @param forceCheck Whether to force a check directly with the API
   * @returns Promise with status check result
   */
  async checkTaskStatus(
    taskId: string,
    forceCheck: boolean = false
  ): Promise<{
    success: boolean;
    status?: string;
    mediaUrl?: string;
    percentage?: number;
    error?: string;
  }> {
    try {
      console.log(`[apiFrameVideoService] Checking task status for ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { 
          taskId,
          forceCheck 
        }
      });

      if (error) {
        console.error(`[apiFrameVideoService] Error checking task status:`, error);
        throw new Error(`Error checking task status: ${error.message || 'Unknown error'}`);
      }

      // If the task is completed and we have a media URL, return it
      if (data.status === 'completed' && data.mediaUrl) {
        return {
          success: true,
          status: 'completed',
          mediaUrl: data.mediaUrl,
          percentage: 100
        };
      }
      
      // If the task failed, return the error
      if (data.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          error: data.error || 'Video generation failed',
          percentage: 0
        };
      }

      // If the task is still processing, return the status and percentage
      return {
        success: true,
        status: data.status || 'processing',
        percentage: data.percentage || 0
      };
    } catch (error) {
      console.error(`[apiFrameVideoService] Failed to check task status:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error checking task status'
      };
    }
  },

  /**
   * Cancel a video generation task
   * 
   * @param taskId Task ID to cancel
   * @returns Promise with cancellation result
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[apiFrameVideoService] Canceling task ${taskId}`);
      
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { taskId }
      });

      if (error) {
        console.error(`[apiFrameVideoService] Error canceling task:`, error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error(`[apiFrameVideoService] Failed to cancel task:`, error);
      return false;
    }
  },
  
  /**
   * Poll for task completion with timeout
   * 
   * @param taskId Task ID to poll
   * @param maxPolls Maximum number of polls 
   * @param interval Polling interval in milliseconds
   * @param onProgress Callback for progress updates
   * @returns Promise with the final result
   */
  async pollTaskUntilComplete(
    taskId: string,
    maxPolls: number = 120,
    interval: number = 10000,
    onProgress?: (percentage: number) => void
  ): Promise<{
    success: boolean;
    mediaUrl?: string;
    error?: string;
  }> {
    let pollCount = 0;
    let lastPercentage = 0;
    
    // Run initial poll immediately
    const initialResult = await this.checkTaskStatus(taskId);
    
    if (initialResult.status === 'completed' && initialResult.mediaUrl) {
      if (onProgress) onProgress(100);
      return {
        success: true,
        mediaUrl: initialResult.mediaUrl
      };
    }
    
    if (initialResult.status === 'failed') {
      return {
        success: false,
        error: initialResult.error || 'Task failed'
      };
    }
    
    // Update initial progress
    if (onProgress && initialResult.percentage) {
      onProgress(initialResult.percentage);
      lastPercentage = initialResult.percentage;
    }
    
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          
          const result = await this.checkTaskStatus(taskId);
          
          // If percentage is available, update progress
          if (onProgress && result.percentage && result.percentage !== lastPercentage) {
            onProgress(result.percentage);
            lastPercentage = result.percentage;
          }
          
          // If complete, resolve
          if (result.status === 'completed' && result.mediaUrl) {
            clearInterval(pollInterval);
            if (onProgress) onProgress(100);
            resolve({
              success: true,
              mediaUrl: result.mediaUrl
            });
          }
          // If failed, reject
          else if (result.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(result.error || 'Video generation failed'));
          }
          // If max polls reached, timeout
          else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            reject(new Error(`Video generation timed out after ${maxPolls * (interval / 1000)} seconds`));
          }
        } catch (error) {
          console.error(`[apiFrameVideoService] Error polling task status:`, error);
          // Continue polling even if there's an error
        }
      }, interval);
    });
  }
};
