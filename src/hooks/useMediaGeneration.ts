
import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { 
  piapiService, 
  PiapiMediaType, 
  PiapiModel, 
  PiapiParams, 
  PiapiTaskResult 
} from '@/services/piapiService';

export interface MediaGenerationConfig {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  onProgress?: (progress: number) => void;
  showToasts?: boolean;
}

export interface MediaGenerationState {
  taskId: string | null;
  status: 'idle' | 'creating' | 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl: string | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook para gerenciar o fluxo de geração de mídia usando a PiAPI
 */
export function useMediaGeneration(config: MediaGenerationConfig = {}) {
  const {
    pollingInterval = 5000,
    maxPollingAttempts = 60, // 5min em intervalos de 5s
    onProgress,
    showToasts = true
  } = config;
  
  const [state, setState] = useState<MediaGenerationState>({
    taskId: null,
    status: 'idle',
    mediaUrl: null,
    isGenerating: false,
    progress: 0,
    error: null
  });
  
  const pollingCountRef = useRef(0);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Função para limpar o polling e inscrição
  const cleanup = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    pollingCountRef.current = 0;
  }, []);

  // Função para iniciar o polling
  const startPolling = useCallback((taskId: string) => {
    if (!taskId) return;
    
    const pollTask = async () => {
      try {
        if (pollingCountRef.current >= maxPollingAttempts) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            isGenerating: false,
            error: 'Tempo limite excedido para geração de mídia'
          }));
          
          if (showToasts) {
            toast.error('Tempo limite excedido para geração de mídia', {
              description: 'A operação demorou muito tempo. Tente novamente.'
            });
          }
          
          cleanup();
          return;
        }
        
        pollingCountRef.current++;
        
        // Calcular progresso aproximado
        const progress = Math.min(95, (pollingCountRef.current / maxPollingAttempts) * 100);
        setState(prev => ({ ...prev, progress }));
        
        if (onProgress) {
          onProgress(progress);
        }
        
        const result = await piapiService.checkTaskStatus(taskId);
        
        if (result.status === 'completed' && result.mediaUrl) {
          setState(prev => ({
            ...prev,
            status: 'completed',
            isGenerating: false,
            mediaUrl: result.mediaUrl,
            progress: 100,
            error: null
          }));
          
          if (showToasts) {
            toast.success('Mídia gerada com sucesso!');
          }
          
          cleanup();
        } else if (result.status === 'failed') {
          setState(prev => ({
            ...prev,
            status: 'failed',
            isGenerating: false,
            error: result.error || 'Erro ao gerar mídia',
            progress: 0
          }));
          
          if (showToasts) {
            toast.error('Falha ao gerar mídia', {
              description: result.error || 'Ocorreu um erro durante o processamento.'
            });
          }
          
          cleanup();
        } else {
          // Continuar polling
          pollingTimerRef.current = setTimeout(pollTask, pollingInterval);
        }
      } catch (error) {
        console.error('Erro durante polling:', error);
        
        setState(prev => ({
          ...prev,
          status: 'failed',
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Erro ao verificar status',
          progress: 0
        }));
        
        if (showToasts) {
          toast.error('Erro ao verificar status da geração', {
            description: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
        
        cleanup();
      }
    };
    
    // Iniciar polling
    pollingTimerRef.current = setTimeout(pollTask, pollingInterval);
  }, [cleanup, maxPollingAttempts, onProgress, pollingInterval, showToasts]);

  // Efeito para configurar inscrição em eventos de mídia
  useEffect(() => {
    unsubscribeRef.current = piapiService.subscribeToTaskUpdates((payload) => {
      const { task_id, media_url, error } = payload.new;
      
      if (task_id === state.taskId) {
        if (error) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            isGenerating: false,
            error,
            progress: 0
          }));
          
          if (showToasts) {
            toast.error('Falha ao gerar mídia', {
              description: error
            });
          }
        } else if (media_url) {
          setState(prev => ({
            ...prev,
            status: 'completed',
            isGenerating: false,
            mediaUrl: media_url,
            progress: 100,
            error: null
          }));
          
          if (showToasts) {
            toast.success('Mídia gerada com sucesso!');
          }
        }
        
        // Limpar polling pois recebemos atualização via subscription
        if (pollingTimerRef.current) {
          clearTimeout(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }
    });
    
    // Limpar inscrição ao desmontar
    return () => {
      cleanup();
    };
  }, [cleanup, state.taskId, showToasts]);

  // Função para gerar mídia
  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: PiapiMediaType,
    model: PiapiModel,
    params: PiapiParams = {},
    sourceUrl?: string
  ): Promise<PiapiTaskResult> => {
    try {
      setState({
        taskId: null,
        status: 'creating',
        mediaUrl: null,
        isGenerating: true,
        progress: 0,
        error: null
      });
      
      if (showToasts) {
        toast.info(`Iniciando geração de ${mediaType}`, {
          description: 'Isso pode levar alguns minutos.'
        });
      }
      
      // Limpar qualquer polling anterior
      cleanup();
      
      let result: PiapiTaskResult;
      
      switch (mediaType) {
        case 'image':
          result = await piapiService.generateImage(prompt, model as any, params);
          break;
        case 'video':
          result = await piapiService.generateVideo(prompt, model as any, params, sourceUrl);
          break;
        case 'audio':
          result = await piapiService.generateAudio(prompt, model as any, params, sourceUrl);
          break;
        default:
          throw new Error(`Tipo de mídia não suportado: ${mediaType}`);
      }
      
      setState(prev => ({
        ...prev,
        taskId: result.taskId,
        status: 'pending',
        isGenerating: true,
        progress: 5
      }));
      
      // Iniciar polling
      startPolling(result.taskId);
      
      return result;
    } catch (error) {
      console.error('Erro ao gerar mídia:', error);
      
      setState({
        taskId: null,
        status: 'failed',
        mediaUrl: null,
        isGenerating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      if (showToasts) {
        toast.error('Erro ao iniciar geração de mídia', {
          description: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      throw error;
    }
  }, [cleanup, showToasts, startPolling]);

  // Função para cancelar geração
  const cancelGeneration = useCallback(async (): Promise<boolean> => {
    if (!state.taskId || !state.isGenerating) {
      return false;
    }
    
    try {
      const success = await piapiService.cancelTask(state.taskId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          status: 'idle',
          isGenerating: false,
          progress: 0,
          error: 'Geração cancelada pelo usuário'
        }));
        
        if (showToasts) {
          toast.info('Geração de mídia cancelada');
        }
        
        cleanup();
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao cancelar geração:', error);
      
      if (showToasts) {
        toast.error('Erro ao cancelar geração', {
          description: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      return false;
    }
  }, [cleanup, showToasts, state.isGenerating, state.taskId]);

  // Função para limpar estado
  const reset = useCallback(() => {
    setState({
      taskId: null,
      status: 'idle',
      mediaUrl: null,
      isGenerating: false,
      progress: 0,
      error: null
    });
    
    cleanup();
  }, [cleanup]);

  return {
    ...state,
    generateMedia,
    cancelGeneration,
    reset
  };
}
