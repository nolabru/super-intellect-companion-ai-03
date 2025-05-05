
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';

interface UseIdeogramGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export function useIdeogramGeneration(options: UseIdeogramGenerationOptions = {}) {
  const {
    showToasts = true,
    onProgress,
    onComplete,
    onError
  } = options;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateImage = useCallback(async (
    prompt: string,
    params: Record<string, any> = {}
  ) => {
    if (isGenerating) {
      if (showToasts) {
        toast.error('An image generation is already in progress');
      }
      return null;
    }
    
    setIsGenerating(true);
    setProgress(10);
    setError(null);
    
    if (onProgress) {
      onProgress(10);
    }
    
    if (showToasts) {
      toast.info('Starting image generation');
    }
    
    try {
      const result = await aiService.generateMedia({
        modelId: 'ideogram-v2',
        prompt,
        type: 'image',
        additionalParams: params
      });
      
      if (result.success && result.mediaUrl) {
        setProgress(100);
        setGeneratedImageUrl(result.mediaUrl);
        
        if (onProgress) {
          onProgress(100);
        }
        
        if (onComplete) {
          onComplete(result.mediaUrl);
        }
        
        if (showToasts) {
          toast.success('Image generated successfully');
        }
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (showToasts) {
        toast.error('Failed to generate image', {
          description: errorMessage
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, onComplete, onError, onProgress, showToasts]);
  
  return {
    generateImage,
    isGenerating,
    progress,
    generatedImageUrl,
    error,
    reset: () => {
      setGeneratedImageUrl(null);
      setError(null);
      setProgress(0);
    }
  };
}
