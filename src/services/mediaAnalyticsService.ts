
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for event tracking
export type MediaEventType = 
  'generation_started' | 
  'generation_completed' | 
  'generation_failed' | 
  'generation_canceled' |
  'file_uploaded' |
  'cache_used';

export type MediaType = 'image' | 'video' | 'audio';

interface TrackEventParams {
  eventType: MediaEventType;
  mediaType: MediaType;
  taskId?: string;
  modelId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  details?: Record<string, any>;
}

export const mediaAnalyticsService = {
  /**
   * Track a media-related event
   */
  async trackEvent({
    eventType,
    mediaType,
    taskId,
    modelId,
    userId,
    duration,
    metadata = {},
    details = {}
  }: TrackEventParams): Promise<boolean> {
    try {
      console.log(`[mediaAnalyticsService] Tracking ${eventType} for ${mediaType}`);
      
      const { error } = await supabase
        .from('media_analytics')
        .insert({
          event_type: eventType,
          media_type: mediaType,
          task_id: taskId,
          model_id: modelId,
          user_id: userId,
          duration,
          metadata,
          details
        });
      
      if (error) {
        console.error('[mediaAnalyticsService] Error tracking event:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('[mediaAnalyticsService] Error tracking event:', err);
      return false;
    }
  },
  
  /**
   * Get event stats for a specific period
   */
  async getEventStats(
    period: '7days' | '30days' | 'all' = '7days',
    userId?: string
  ): Promise<any> {
    try {
      console.log(`[mediaAnalyticsService] Getting event stats for period: ${period}`);
      
      // Logic to fetch and process analytics data based on period
      // This would be implemented based on specific reporting requirements
      
      return { success: true };
    } catch (err) {
      console.error('[mediaAnalyticsService] Error getting event stats:', err);
      return { success: false, error: 'Failed to retrieve analytics data' };
    }
  }
};

// Export a utility for easy event tracking from anywhere in the app
export const trackMediaEvent = (params: TrackEventParams): void => {
  // Fire and forget - we don't want to wait for the tracking to complete
  mediaAnalyticsService.trackEvent(params).catch(err => {
    console.error('[trackMediaEvent] Failed to track event:', err);
  });
};
