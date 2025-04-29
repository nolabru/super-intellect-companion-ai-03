import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface CachedMedia {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  prompt: string;
  model: string;
  createdAt: string;
  parameters?: Record<string, any>;
  cacheKey?: string;
}

interface MediaCacheOptions {
  maxItems?: number;
  expireAfterDays?: number;
}

const DEFAULT_CACHE_KEY = 'media_cache';
const DEFAULT_MAX_ITEMS = 50;
const DEFAULT_EXPIRE_DAYS = 7;

/**
 * Hook for caching generated media to improve performance
 */
export function useMediaCache(options: MediaCacheOptions = {}) {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    expireAfterDays = DEFAULT_EXPIRE_DAYS,
  } = options;
  
  const [cache, setCache] = useState<Record<string, CachedMedia>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Load cache from localStorage on component mount
  useEffect(() => {
    loadCache();
    setIsInitialized(true);
  }, []);
  
  // Load the media cache from localStorage
  const loadCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(DEFAULT_CACHE_KEY);
      
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        
        // Clean up expired items
        const now = new Date();
        const cleanedCache: Record<string, CachedMedia> = {};
        
        Object.keys(parsedCache).forEach(key => {
          const item = parsedCache[key];
          const itemDate = new Date(item.createdAt);
          const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Keep if not expired
          if (diffDays < expireAfterDays) {
            cleanedCache[key] = item;
          }
        });
        
        setCache(cleanedCache);
        return cleanedCache;
      }
    } catch (error) {
      console.error('Failed to load media cache:', error);
    }
    
    return {};
  }, [expireAfterDays]);
  
  // Save the media cache to localStorage
  const saveCache = useCallback((newCache: Record<string, CachedMedia>) => {
    try {
      localStorage.setItem(DEFAULT_CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Failed to save media cache:', error);
    }
  }, []);
  
  // Add media to cache
  const cacheMedia = useCallback((
    url: string,
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    parameters?: Record<string, any>,
    cacheKey?: string
  ) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Generate cache key if not provided
    const mediaKey = cacheKey || generateCacheKey(prompt, model, parameters);
    
    const mediaItem: CachedMedia = {
      id,
      url,
      type,
      prompt,
      model,
      createdAt: now,
      parameters,
      cacheKey: mediaKey
    };
    
    setCache(prevCache => {
      const newCache = {
        ...prevCache,
        [mediaKey]: mediaItem
      };
      
      // Limit cache size by removing oldest items
      const keys = Object.keys(newCache);
      if (keys.length > maxItems) {
        // Sort by creation date (oldest first)
        const sortedKeys = keys.sort((a, b) => {
          const dateA = new Date(newCache[a].createdAt).getTime();
          const dateB = new Date(newCache[b].createdAt).getTime();
          return dateA - dateB;
        });
        
        // Remove oldest items
        const keysToRemove = sortedKeys.slice(0, keys.length - maxItems);
        keysToRemove.forEach(key => {
          delete newCache[key];
        });
      }
      
      saveCache(newCache);
      return newCache;
    });
    
    return mediaItem;
  }, [maxItems, saveCache]);
  
  // Find media in cache by prompt and model
  const findCachedMedia = useCallback((
    prompt: string,
    model: string,
    parameters?: Record<string, any>
  ): CachedMedia | null => {
    const cacheKey = generateCacheKey(prompt, model, parameters);
    return cache[cacheKey] || null;
  }, [cache]);
  
  // Remove media from cache
  const removeCachedMedia = useCallback((cacheKey: string) => {
    setCache(prevCache => {
      if (!prevCache[cacheKey]) {
        return prevCache;
      }
      
      const newCache = { ...prevCache };
      delete newCache[cacheKey];
      
      saveCache(newCache);
      return newCache;
    });
  }, [saveCache]);
  
  // Clear entire cache
  const clearCache = useCallback(() => {
    setCache({});
    localStorage.removeItem(DEFAULT_CACHE_KEY);
  }, []);
  
  // Generate a unique cache key based on prompt, model and parameters
  function generateCacheKey(
    prompt: string,
    model: string,
    parameters?: Record<string, any>
  ): string {
    // Create a simplified version of parameters to avoid minor differences
    // affecting the cache key (like order of properties)
    const simplifiedParams = parameters ? JSON.stringify(sortObjectKeys(parameters)) : '';
    return `${prompt.trim().toLowerCase()}_${model}_${simplifiedParams}`;
  }
  
  // Sort object keys to ensure consistent parameter serialization
  function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortObjectKeys(obj[key]);
        return sorted;
      }, {} as Record<string, any>);
  }
  
  return {
    cache,
    isInitialized,
    cacheMedia,
    findCachedMedia,
    removeCachedMedia,
    clearCache,
    generateCacheKey
  };
}
