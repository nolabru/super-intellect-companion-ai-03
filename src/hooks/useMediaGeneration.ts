
import { useState, useCallback, useRef } from 'react';
import { mediaService, MediaGenerationResult } from '@/services/mediaService';
import { PiapiMediaType, PiapiModel, PiapiParams } from '@/services/piapiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MediaGenerationHookOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (result: MediaGenerationResult) => void;
  autoSaveToGallery?: boolean;
}

export interface GenerationTask {
  taskId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

export function useMediaGeneration(options: MediaGenerationHookOptions = {}) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Record<string, GenerationTask>>({});
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const abortControllers = useRef<Record<string, AbortController>>({});

  /**
   * Gerar mídia usando serviços centralizados
   */
  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: PiapiMediaType,
    model: PiapiModel,
    params: PiapiParams = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    try {
      setIsGenerating(true);
      
      if (options.showToasts !== false) {
        toast.info(`Iniciando geração de ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'vídeo' : 'áudio'}...`);
      }
      
      // Criar controller para possibilitar cancelamento
      const controller = new AbortController();
      
      // Configurar handler de progresso
      const handleProgress = (taskId: string) => (progress: number) => {
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress
          }
        }));
        
        if (options.onProgress) {
          options.onProgress(progress);
        }
      };
      
      // Iniciar geração
      const result = await mediaService.generateMedia(
        prompt, 
        mediaType, 
        model, 
        params,
        {
          userId: user?.id,
          shouldCheckTokens: true,
          shouldTrackProgress: true,
          onProgress: currentTaskId ? handleProgress(currentTaskId) : undefined
        },
        referenceUrl
      );
      
      // Registrar tarefa
      if (result.success && result.taskId) {
        const taskId = result.taskId;
        setCurrentTaskId(taskId);
        abortControllers.current[taskId] = controller;
        
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            taskId,
            progress: 0,
            status: 'pending'
          }
        }));
        
        // Monitorar status periodicamente
        const checkStatusInterval = setInterval(async () => {
          try {
            if (controller.signal.aborted) {
              clearInterval(checkStatusInterval);
              return;
            }
            
            const statusResult = await mediaService.checkTaskStatus(taskId);
            
            setTasks(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: statusResult.status as any,
                mediaUrl: statusResult.mediaUrl,
                error: statusResult.error
              }
            }));
            
            // Se completou ou falhou, parar monitoramento
            if (statusResult.status === 'completed' || statusResult.status === 'failed') {
              clearInterval(checkStatusInterval);
              
              // Salvar na galeria automaticamente se solicitado
              if (options.autoSaveToGallery !== false && 
                  statusResult.status === 'completed' && 
                  statusResult.mediaUrl) {
                mediaService.saveToGallery(
                  statusResult.mediaUrl,
                  prompt,
                  mediaType,
                  model as string,
                  user?.id
                );
              }
              
              // Notificar conclusão
              if (options.onComplete) {
                options.onComplete(statusResult);
              }
              
              // Notificar usuário
              if (options.showToasts !== false) {
                if (statusResult.status === 'completed') {
                  toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} gerado com sucesso!`);
                } else {
                  toast.error(`Erro ao gerar ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'vídeo' : 'áudio'}`);
                }
              }
            }
          } catch (err) {
            console.error('[useMediaGeneration] Erro ao verificar status:', err);
          }
        }, 3000);
        
        // Limpar interval após timeout
        setTimeout(() => {
          clearInterval(checkStatusInterval);
        }, 10 * 60 * 1000); // 10 minutos de timeout
      } else if (!result.success && options.showToasts !== false) {
        toast.error(`Erro ao iniciar geração: ${result.error}`);
      }
      
      return result;
    } catch (err) {
      console.error('[useMediaGeneration] Erro ao gerar mídia:', err);
      
      if (options.showToasts !== false) {
        toast.error(`Erro ao gerar mídia: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
      
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, options]);

  /**
   * Cancelar uma tarefa de geração de mídia
   */
  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      if (!taskId) return false;
      
      // Abortar controller se existir
      if (abortControllers.current[taskId]) {
        abortControllers.current[taskId].abort();
        delete abortControllers.current[taskId];
      }
      
      // Cancelar tarefa no serviço
      const result = await mediaService.cancelTask(taskId);
      
      if (result) {
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'failed',
            error: 'Tarefa cancelada pelo usuário'
          }
        }));
        
        if (options.showToasts !== false) {
          toast.info('Tarefa de geração cancelada');
        }
      }
      
      return result;
    } catch (err) {
      console.error('[useMediaGeneration] Erro ao cancelar tarefa:', err);
      return false;
    }
  }, [options]);

  /**
   * Limpar tarefas
   */
  const clearTasks = useCallback(() => {
    // Cancelar todos os controllers ativos
    Object.values(abortControllers.current).forEach(controller => {
      try {
        controller.abort();
      } catch (err) {
        console.error('[useMediaGeneration] Erro ao abortar controller:', err);
      }
    });
    
    abortControllers.current = {};
    setTasks({});
    setCurrentTaskId(null);
  }, []);

  return {
    generateMedia,
    cancelTask,
    clearTasks,
    isGenerating,
    tasks,
    currentTask: currentTaskId ? tasks[currentTaskId] : null
  };
}
