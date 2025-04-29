
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface MediaTelemetryEvent {
  eventType: 'generation_start' | 'generation_complete' | 'generation_error' | 
             'media_view' | 'media_save' | 'media_delete' | 'cache_hit' | 'cache_miss' |
             'compression_applied' | 'performance_metric';
  mediaType: 'image' | 'video' | 'audio' | null;
  modelId?: string;
  taskId?: string;
  duration?: number; // in milliseconds
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TelemetryOptions {
  enabled: boolean;
  anonymousTracking: boolean;
  performanceMetrics: boolean;
  errorReporting: boolean;
}

/**
 * Service for tracking metrics and events related to media generation and usage
 */
export const mediaTelemetryService = {
  // Default options
  options: {
    enabled: true,
    anonymousTracking: true,
    performanceMetrics: true,
    errorReporting: true
  } as TelemetryOptions,

  /**
   * Initialize the telemetry service with custom options
   */
  initialize(options?: Partial<TelemetryOptions>): void {
    this.options = { ...this.options, ...options };
    console.log(`[MediaTelemetry] Initialized with options:`, this.options);
  },

  /**
   * Log a media-related event
   */
  async logEvent(event: MediaTelemetryEvent, userId?: string): Promise<string | null> {
    if (!this.options.enabled) {
      return null;
    }

    // Skip performance metrics if disabled
    if (event.eventType === 'performance_metric' && !this.options.performanceMetrics) {
      return null;
    }

    // Skip error reporting if disabled
    if (event.eventType === 'generation_error' && !this.options.errorReporting) {
      return null;
    }

    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Store the event in Supabase
      const { error } = await supabase
        .from('media_analytics')
        .insert({
          id: eventId,
          event_type: event.eventType,
          media_type: event.mediaType,
          model_id: event.modelId,
          task_id: event.taskId,
          user_id: this.options.anonymousTracking ? null : userId,
          duration: event.duration,
          details: event.details || {},
          metadata: {
            ...event.metadata,
            timestamp,
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        });

      if (error) {
        console.error('[MediaTelemetry] Failed to log event:', error);
        return null;
      }

      console.log(`[MediaTelemetry] Event logged: ${event.eventType}`);
      return eventId;
    } catch (error) {
      console.error('[MediaTelemetry] Error logging event:', error);
      return null;
    }
  },

  /**
   * Log performance metrics
   */
  async logPerformanceMetric(
    metricName: string,
    durationMs: number,
    mediaType?: 'image' | 'video' | 'audio',
    additionalData?: Record<string, any>
  ): Promise<string | null> {
    return this.logEvent({
      eventType: 'performance_metric',
      mediaType: mediaType || null,
      duration: durationMs,
      details: {
        metricName,
        ...additionalData
      }
    });
  },

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string): () => Promise<string | null> {
    if (!this.options.enabled || !this.options.performanceMetrics) {
      return async () => null;
    }
    
    const startTime = performance.now();
    
    return async (additionalData?: Record<string, any>, mediaType?: 'image' | 'video' | 'audio') => {
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      return this.logPerformanceMetric(name, durationMs, mediaType, additionalData);
    };
  },
  
  /**
   * Log media generation event
   */
  async logGeneration(
    status: 'start' | 'complete' | 'error',
    mediaType: 'image' | 'video' | 'audio',
    modelId: string,
    taskId: string,
    details?: Record<string, any>,
    durationMs?: number
  ): Promise<string | null> {
    let eventType: MediaTelemetryEvent['eventType'];
    
    switch (status) {
      case 'start':
        eventType = 'generation_start';
        break;
      case 'complete':
        eventType = 'generation_complete';
        break;
      case 'error':
        eventType = 'generation_error';
        break;
      default:
        eventType = 'generation_start';
    }
    
    return this.logEvent({
      eventType,
      mediaType,
      modelId,
      taskId,
      duration: durationMs,
      details
    });
  },

  /**
   * Get aggregated analytics data
   */
  async getAnalytics(
    filters: {
      startDate?: Date;
      endDate?: Date;
      mediaType?: 'image' | 'video' | 'audio';
      eventType?: MediaTelemetryEvent['eventType'];
      modelId?: string;
      userId?: string;
    } = {}
  ): Promise<any> {
    try {
      let query = supabase
        .from('media_analytics')
        .select('*');

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      
      if (filters.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }
      
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      
      if (filters.modelId) {
        query = query.eq('model_id', filters.modelId);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[MediaTelemetry] Failed to fetch analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[MediaTelemetry] Error fetching analytics:', error);
      return null;
    }
  }
};
