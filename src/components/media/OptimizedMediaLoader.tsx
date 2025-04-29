
import React, { useState, useEffect } from 'react';
import { useMediaCache } from '@/hooks/useMediaCache';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedMediaLoaderProps {
  src: string;
  alt?: string;
  type: 'image' | 'video' | 'audio';
  className?: string;
  priority?: boolean; // If true, will load at higher priority
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * A component that optimizes media loading with progressive loading,
 * caching, and error handling
 */
const OptimizedMediaLoader: React.FC<OptimizedMediaLoaderProps> = ({
  src,
  alt = '',
  type,
  className = '',
  priority = false,
  onLoad,
  onError,
  fallbackSrc
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingSrc, setLoadingSrc] = useState<string | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'slow' | 'medium' | 'fast'>('medium');
  
  // Use connection information to determine loading strategy
  useEffect(() => {
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      
      // Determine connection quality based on effectiveType
      if (connection.effectiveType === '4g') {
        setConnectionQuality('fast');
      } else if (connection.effectiveType === '3g') {
        setConnectionQuality('medium');
      } else {
        setConnectionQuality('slow');
      }
      
      // Listen for connection changes
      const updateConnectionQuality = () => {
        if (connection.effectiveType === '4g') {
          setConnectionQuality('fast');
        } else if (connection.effectiveType === '3g') {
          setConnectionQuality('medium');
        } else {
          setConnectionQuality('slow');
        }
      };
      
      connection.addEventListener('change', updateConnectionQuality);
      return () => connection.removeEventListener('change', updateConnectionQuality);
    }
  }, []);
  
  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setHasError(false);
    
    // If on slow connection and type is image, we could load a lower quality version first
    if (type === 'image' && connectionQuality === 'slow' && !src.includes('data:')) {
      // This could be replaced with a real thumbnail generator in production
      setLoadingSrc(`${src}?quality=low`);
    } else {
      setLoadingSrc(src);
    }
    
    // Preload the media
    if (type === 'image') {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoading(false);
        setLoadingSrc(src);
        if (onLoad) onLoad();
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
        if (onError) onError();
      };
    }
    
    // For video and audio, we'll handle loading in the component itself
  }, [src, type, connectionQuality, onLoad, onError]);
  
  const handleMediaLoaded = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };
  
  const handleMediaError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError();
  };
  
  const renderMedia = () => {
    if (hasError && fallbackSrc) {
      // Show fallback if available
      if (type === 'image') {
        return (
          <img 
            src={fallbackSrc} 
            alt={alt || 'Image could not be loaded'} 
            className={cn(className, 'transition-opacity duration-300')} 
          />
        );
      } else if (type === 'video') {
        return (
          <video 
            src={fallbackSrc} 
            controls 
            className={cn(className, 'transition-opacity duration-300')} 
          />
        );
      } else if (type === 'audio') {
        return (
          <audio 
            src={fallbackSrc} 
            controls 
            className={cn(className, 'transition-opacity duration-300')} 
          />
        );
      }
    }
    
    if (hasError) {
      // Show error state if no fallback
      return (
        <div className={cn(
          'flex flex-col items-center justify-center p-4 border border-red-300 bg-red-50 rounded',
          className
        )}>
          <p className="text-red-500 text-sm">
            Failed to load {type}
          </p>
          <button 
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              // Force reload by creating a cache-busting URL
              setLoadingSrc(`${src}?t=${Date.now()}`);
            }}
            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      );
    }
    
    // Show loading spinner while loading
    if (isLoading) {
      return (
        <div className={cn(
          'flex items-center justify-center bg-gray-100',
          className
        )}>
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }
    
    // Render the media based on type
    if (type === 'image') {
      return (
        <img 
          src={loadingSrc || src} 
          alt={alt} 
          className={cn(className, 'transition-opacity duration-300')} 
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
          loading={priority ? 'eager' : 'lazy'}
        />
      );
    } else if (type === 'video') {
      return (
        <video 
          src={loadingSrc || src} 
          controls 
          className={cn(className, 'transition-opacity duration-300')} 
          onLoadedData={handleMediaLoaded}
          onError={handleMediaError}
          preload={priority ? 'auto' : 'metadata'}
        />
      );
    } else if (type === 'audio') {
      return (
        <audio 
          src={loadingSrc || src} 
          controls 
          className={cn(className, 'transition-opacity duration-300')} 
          onLoadedData={handleMediaLoaded}
          onError={handleMediaError}
          preload={priority ? 'auto' : 'metadata'}
        />
      );
    }
    
    return null;
  };
  
  return (
    <div className="relative">
      {renderMedia()}
    </div>
  );
};

export default OptimizedMediaLoader;
