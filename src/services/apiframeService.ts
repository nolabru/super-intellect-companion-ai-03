
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for interacting with APIframe API
 */
export const apiframeService = {
  /**
   * Check if API key is configured
   */
  isApiKeyConfigured: (): boolean => {
    // We're using a server-side API key, so it's always configured
    return true;
  },
  
  /**
   * Test connection to APIframe API
   */
  testConnection: async (): Promise<{
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
   * Generate media using APIframe
   */
  generateMedia: async (params: any): Promise<any> {
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
  checkTaskStatus: async (taskId: string): Promise<any> {
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
  cancelTask: async (taskId: string): Promise<boolean> {
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
  }
};
