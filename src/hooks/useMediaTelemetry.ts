
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mediaTelemetryService, MediaTelemetryEvent, TelemetryOptions } from '@/services/mediaTelemetryService';

export interface UseMediaTelemetryOptions extends Partial<TelemetryOptions> {
  autoTrackPageView?: boolean;
}

/**
 * Hook for tracking media-related events and metrics
 */
export function useMediaTelemetry(options: UseMediaTelemetryOptions = {}) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the telemetry service with provided options
  useEffect(() => {
    mediaTelemetryService.initialize(options);
    setIsInitialized(true);
    
    // Track page view if enabled
    if (options.autoTrackPageView) {
      trackEvent('page_view', {
        path: window.location.pathname,
        query: window.location.search
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled, options.anonymousTracking, options.performanceMetrics, options.errorReporting, options.autoTrackPageView]);

  /**
   * Track a custom event
   */
  const trackEvent = useCallback((
    eventName: string, 
    data?: Record<string, any>,
    mediaType?: 'image' | 'video' | 'audio'
  ) => {
    if (!isInitialized) return null;
    
    return mediaTelemetryService.logEvent({
      eventType: 'performance_metric', // Using this as a generic type for custom events
      mediaType: mediaType || null,
      details: {
        eventName,
        ...data
      }
    }, user?.id);
  }, [isInitialized, user]);

  /**
   * Start measuring performance for a named operation
   */
  const startMeasurement = useCallback((name: string) => {
    if (!isInitialized) return async () => null;
    
    return mediaTelemetryService.startMeasurement(name);
  }, [isInitialized]);

  /**
   * Track media generation events
   */
  const trackGeneration = useCallback((
    status: 'start' | 'complete' | 'error',
    mediaType: 'image' | 'video' | 'audio',
    modelId: string,
    taskId: string,
    details?: Record<string, any>,
    durationMs?: number
  ) => {
    if (!isInitialized) return null;
    
    return mediaTelemetryService.logGeneration(
      status,
      mediaType,
      modelId,
      taskId,
      details,
      durationMs
    );
  }, [isInitialized]);

  /**
   * Track media view event
   */
  const trackMediaView = useCallback((
    mediaType: 'image' | 'video' | 'audio',
    mediaUrl: string,
    modelId?: string
  ) => {
    if (!isInitialized) return null;
    
    return mediaTelemetryService.logEvent({
      eventType: 'media_view',
      mediaType,
      modelId,
      details: {
        mediaUrl
      }
    }, user?.id);
  }, [isInitialized, user]);

  /**
   * Track media save/favorite event
   */
  const trackMediaSave = useCallback((
    mediaType: 'image' | 'video' | 'audio',
    mediaUrl: string,
    modelId?: string,
    prompt?: string
  ) => {
    if (!isInitialized) return null;
    
    return mediaTelemetryService.logEvent({
      eventType: 'media_save',
      mediaType,
      modelId,
      details: {
        mediaUrl,
        prompt
      }
    }, user?.id);
  }, [isInitialized, user]);

  /**
   * Track media cache events
   */
  const trackCacheEvent = useCallback((
    eventType: 'hit' | 'miss',
    mediaType: 'image' | 'video' | 'audio',
    modelId: string,
    prompt: string
  ) => {
    if (!isInitialized) return null;
    
    return mediaTelemetryService.logEvent({
      eventType: eventType === 'hit' ? 'cache_hit' : 'cache_miss',
      mediaType,
      modelId,
      details: {
        prompt
      }
    }, user?.id);
  }, [isInitialized, user]);

  return {
    trackEvent,
    startMeasurement,
    trackGeneration,
    trackMediaView,
    trackMediaSave,
    trackCacheEvent,
    isInitialized
  };
}
