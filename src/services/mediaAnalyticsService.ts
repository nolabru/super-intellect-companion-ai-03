
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
   * Track the start of a media generation
   */
  trackGenerationStart(mediaType: MediaType, taskId: string, modelId?: string): Promise<boolean> {
    return this.trackEvent({
      eventType: 'generation_started',
      mediaType,
      taskId,
      modelId,
      metadata: { timestamp: Date.now() }
    });
  },
  
  /**
   * Track the completion of a media generation
   */
  trackGenerationComplete(
    mediaType: MediaType, 
    taskId: string, 
    modelId?: string, 
    duration?: number, 
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackEvent({
      eventType: 'generation_completed',
      mediaType,
      taskId,
      modelId,
      duration,
      metadata
    });
  },
  
  /**
   * Track a failed media generation
   */
  trackGenerationFailed(
    mediaType: MediaType, 
    taskId: string, 
    error?: string,
    modelId?: string
  ): Promise<boolean> {
    return this.trackEvent({
      eventType: 'generation_failed',
      mediaType,
      taskId,
      modelId,
      details: { error }
    });
  },
  
  /**
   * Track the use of cached media
   */
  trackCacheUse(
    mediaType: MediaType,
    modelId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.trackEvent({
      eventType: 'cache_used',
      mediaType,
      modelId,
      metadata: { ...metadata, timestamp: Date.now() }
    });
  },
  
  /**
   * Get event stats for a specific period
   */
  async getEventStats(
    period: '7days' | '30days' | 'all' = '7days',
    userId?: string,
    mediaType?: MediaType
  ): Promise<any> {
    try {
      console.log(`[mediaAnalyticsService] Getting event stats for period: ${period}`);
      
      const today = new Date();
      let startDate;
      
      if (period === '7days') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      } else if (period === '30days') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
      }
      
      let query = supabase
        .from('media_analytics')
        .select('*');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return { 
        success: true,
        data,
        totalCount: data?.length || 0,
        periodStart: startDate?.toISOString(),
        periodEnd: today.toISOString()
      };
    } catch (err) {
      console.error('[mediaAnalyticsService] Error getting event stats:', err);
      return { success: false, error: 'Failed to retrieve analytics data' };
    }
  },
  
  /**
   * Get stats about model usage
   */
  async getModelUsageStats(period: '7days' | '30days' | 'all' = '7days'): Promise<any> {
    try {
      const { data } = await this.getEventStats(period);
      
      if (!data || data.length === 0) {
        return { models: {}, total: 0 };
      }
      
      const models: Record<string, number> = {};
      let total = 0;
      
      // Only count completed generations
      data.filter(item => item.event_type === 'generation_completed').forEach(item => {
        if (item.model_id) {
          models[item.model_id] = (models[item.model_id] || 0) + 1;
          total++;
        }
      });
      
      return { models, total };
    } catch (err) {
      console.error('[mediaAnalyticsService] Error getting model usage stats:', err);
      return { models: {}, total: 0 };
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
