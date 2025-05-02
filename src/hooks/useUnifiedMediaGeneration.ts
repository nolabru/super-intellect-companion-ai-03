
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MediaGenerationParams, MediaGenerationTask } from '@/types/mediaGeneration';
import { supabase } from '@/integrations/supabase/client';
import { useMediaServiceAdapter } from '@/adapters/mediaServiceAdapter';

interface UnifiedMediaGenerationOptions {
  showToasts?: boolean;
  onComplete?: (mediaUrl: string) => void;
  onError?: (error: string) => void;
}

export function useUnifiedMediaGeneration(options: UnifiedMediaGenerationOptions = {}) {
  const { showToasts = true, onComplete, onError } = options;
  
  // Estado
  const [activeProvider, setActiveProvider] = useState<'piapi'>('piapi');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<MediaGenerationTask | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  
  // Usar o adaptador de serviço de mídia
  const mediaService = useMediaServiceAdapter(activeProvider, {
    showToasts,
    onTaskUpdate: (task: any) => {
      setCurrentTask(task);
      
      if (task.status === 'completed' && task.mediaUrl) {
        setGeneratedMediaUrl(task.mediaUrl);
        setIsGenerating(false);
        if (onComplete) {
          onComplete(task.mediaUrl);
        }
      } else if (task.status === 'failed') {
        setIsGenerating(false);
        if (onError && task.error) {
          onError(task.error);
        }
      }
    }
  });
  
  // Gerar mídia usando o provedor ativo
  const generateMedia = useCallback(async (
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: MediaGenerationParams = {},
    referenceUrl?: string
  ) => {
    try {
      setIsGenerating(true);
      setGeneratedMediaUrl(null);
      
      const result = await mediaService.generateMedia(type, prompt, model, params, referenceUrl);
      
      if (!result.success) {
        setIsGenerating(false);
        if (onError) {
          onError(result.error || 'Erro desconhecido ao gerar mídia');
        }
        return result;
      }
      
      return result;
    } catch (error) {
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (showToasts) {
        toast.error(`Erro ao gerar mídia: ${errorMessage}`);
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error('Erro ao gerar mídia unificada:', error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [mediaService, onComplete, onError, showToasts]);
  
  // Cancelar geração em andamento
  const cancelGeneration = useCallback(async () => {
    try {
      if (activeProvider === 'piapi') {
        return await mediaService.cancelGeneration();
      }
      return false;
    } catch (error) {
      console.error('Erro ao cancelar geração:', error);
      return false;
    }
  }, [activeProvider, mediaService]);
  
  // Trocar provedor de mídia
  const switchProvider = useCallback((provider: 'piapi') => {
    if (isGenerating) {
      if (showToasts) {
        toast.error('Não é possível trocar o provedor durante uma geração');
      }
      return false;
    }
    
    setActiveProvider(provider);
    return true;
  }, [isGenerating, showToasts]);
  
  return {
    // Estado
    activeProvider,
    isGenerating,
    currentTask,
    generatedMediaUrl,
    
    // Ações
    generateMedia,
    cancelGeneration,
    switchProvider
  };
}
