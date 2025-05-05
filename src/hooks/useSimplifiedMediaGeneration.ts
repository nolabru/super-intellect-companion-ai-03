
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/services/aiService';

interface MediaGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (mediaUrl: string) => void;
  onError?: (error: string) => void;
}

export function useSimplifiedMediaGeneration(options: MediaGenerationOptions = {}) {
  const {
    showToasts = true,
    onProgress,
    onComplete,
    onError
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<{
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
    progress: number;
    mediaUrl?: string;
    error?: string;
    prompt?: string;
    model?: string;
    type?: 'image' | 'video' | 'audio';
  } | null>(null);

  const generateMedia = useCallback(async (
    prompt: string,
    type: 'image' | 'video' | 'audio',
    modelId: string,
    params: Record<string, any> = {},
    referenceUrl?: string
  ) => {
    if (isGenerating) {
      if (showToasts) {
        toast.error('A media generation task is already in progress');
      }
      return null;
    }

    const taskId = uuidv4();
    setIsGenerating(true);
    setCurrentTask({
      taskId,
      status: 'pending',
      progress: 0,
      prompt,
      model: modelId,
      type
    });

    if (showToasts) {
      toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started`);
    }

    if (onProgress) {
      onProgress(0);
    }

    try {
      // Update to processing
      setCurrentTask(prev => prev ? {
        ...prev,
        status: 'processing',
        progress: 10
      } : null);
      
      if (onProgress) {
        onProgress(10);
      }

      // For now, we only support Ideogram image generation through aiService
      if (type === 'image' && modelId === 'ideogram-v2') {
        const result = await aiService.generateMedia({
          modelId,
          prompt,
          type: 'image',
          additionalParams: params,
          referenceUrl
        });
        
        if (result.success && result.mediaUrl) {
          setCurrentTask(prev => prev ? {
            ...prev,
            status: 'completed',
            progress: 100,
            mediaUrl: result.mediaUrl
          } : null);
          
          if (onProgress) {
            onProgress(100);
          }
          
          if (onComplete) {
            onComplete(result.mediaUrl);
          }
          
          if (showToasts) {
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully`);
          }
          
          setIsGenerating(false);
          return result.mediaUrl;
        } else {
          throw new Error(result.error || 'Failed to generate media');
        }
      } else {
        throw new Error(`Unsupported media type or model: ${type} / ${modelId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setCurrentTask(prev => prev ? {
        ...prev,
        status: 'failed',
        progress: 0,
        error: errorMessage
      } : null);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (showToasts) {
        toast.error(`Failed to generate ${type}`, {
          description: errorMessage
        });
      }
      
      setIsGenerating(false);
      return null;
    }
  }, [isGenerating, onComplete, onError, onProgress, showToasts]);

  const cancelGeneration = useCallback(() => {
    if (!isGenerating || !currentTask) {
      return false;
    }
    
    // For now, we don't have a real cancel mechanism for Ideogram
    setCurrentTask(prev => prev ? {
      ...prev,
      status: 'canceled',
      progress: 0,
      error: 'Canceled by user'
    } : null);
    
    setIsGenerating(false);
    
    if (showToasts) {
      toast.info('Generation canceled');
    }
    
    return true;
  }, [currentTask, isGenerating, showToasts]);

  return {
    generateMedia,
    cancelGeneration,
    isGenerating,
    currentTask
  };
}
