
import { useState, useCallback, useEffect } from 'react';
import { mediaCompressionService } from '@/services/mediaCompressionService';

interface MediaLoadingOptions {
  shouldCompress?: boolean;
  maxWidthOrHeight?: number;
  quality?: number;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Hook for handling media loading states, errors, and optimization
 */
export function useMediaLoading(
  mediaUrl: string | null, 
  options: MediaLoadingOptions = {}
) {
  const {
    shouldCompress = false,
    maxWidthOrHeight = 1024,
    quality = 0.8,
    autoRetry = true,
    maxRetries = 2,
    retryDelay = 2000
  } = options;

  const [isLoading, setIsLoading] = useState<boolean>(!!mediaUrl);
  const [hasError, setHasError] = useState<boolean>(false);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Handle media load success
  const handleMediaLoaded = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  }, []);
  
  // Handle media load error
  const handleMediaError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // Auto-retry if enabled and under max retry count
    if (autoRetry && retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);
      
      setTimeout(() => {
        console.log(`[useMediaLoading] Auto-retrying (attempt ${nextRetryCount}/${maxRetries})...`);
        setIsLoading(true);
        setHasError(false);
        // Force browser to reload by adding a cache-busting parameter
        setOptimizedUrl(mediaUrl ? `${mediaUrl}?t=${Date.now()}` : null);
      }, retryDelay);
    }
  }, [autoRetry, maxRetries, retryCount, retryDelay, mediaUrl]);
  
  // Manually retry loading
  const retryMediaLoad = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setOptimizedUrl(mediaUrl ? `${mediaUrl}?t=${Date.now()}` : null);
  }, [mediaUrl]);
  
  // Optimize image if requested
  useEffect(() => {
    if (!mediaUrl) {
      setIsLoading(false);
      setHasError(false);
      setOptimizedUrl(null);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    if (shouldCompress && mediaUrl.startsWith('http') && mediaUrl.match(/\.(jpe?g|png|webp)$/i)) {
      // Only compress image types, not videos or audio
      mediaCompressionService.compressImage(mediaUrl, {
        maxWidthOrHeight,
        quality,
        format: mediaCompressionService.detectBestFormat()
      })
        .then(optimized => {
          setOptimizedUrl(optimized);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[useMediaLoading] Compression error:', err);
          // Fall back to original URL if compression fails
          setOptimizedUrl(mediaUrl);
          setIsLoading(false);
        });
    } else {
      // Use original URL for non-image types or when compression is disabled
      setOptimizedUrl(mediaUrl);
    }
  }, [mediaUrl, shouldCompress, maxWidthOrHeight, quality]);
  
  return {
    isLoading,
    hasError,
    optimizedUrl: optimizedUrl || mediaUrl,
    handleMediaLoaded,
    handleMediaError,
    retryMediaLoad,
    retryCount
  };
}
