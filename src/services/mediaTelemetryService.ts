
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
   * Get aggregated analytics data using a Fetch API call rather than direct Supabase access
   * This works around type issues with missing table definitions
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
      // Build query params
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('start_date', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        params.append('end_date', filters.endDate.toISOString());
      }
      
      if (filters.mediaType) {
        params.append('media_type', filters.mediaType);
      }
      
      if (filters.eventType) {
        params.append('event_type', filters.eventType);
      }
      
      if (filters.modelId) {
        params.append('model_id', filters.modelId);
      }
      
      if (filters.userId) {
        params.append('user_id', filters.userId);
      }
      
      // Get Supabase auth token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Get Supabase URL and key using available properties
      const supabaseUrl = "https://vygluorjwehcdigzxbaa.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z2x1b3Jqd2VoY2RpZ3p4YmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI2NjcsImV4cCI6MjA1OTYxODY2N30.uuV_JYIUKuv1rV3-MicDiTT28azOWdhJoVjpHMfzVGg";
      
      // Construct URL using the project URL
      const url = `${supabaseUrl}/rest/v1/media_analytics?${params.toString()}&order=created_at.desc`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[MediaTelemetry] Error fetching analytics:', error);
      return [];
    }
  }
};
