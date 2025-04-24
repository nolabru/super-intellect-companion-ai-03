
import { useState, useCallback, useRef } from 'react';
import { mediaService, MediaGenerationResult } from '@/services/mediaService';
import { PiapiMediaType, PiapiModel, PiapiParams, PiapiTaskResult, piapiService } from '@/services/piapiService';
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
   * Gerar mídia usando diretamente o serviço PIAPI
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
      
      // Iniciar geração com PIAPI diretamente
      let result: PiapiTaskResult;
      
      console.log(`[useMediaGeneration] Iniciando geração de ${mediaType} com modelo ${model}`);
      
      try {
        if (mediaType === 'image') {
          result = await piapiService.generateImage(prompt, model as any, params);
        } else if (mediaType === 'video') {
          result = await piapiService.generateVideo(prompt, model as any, params, referenceUrl);
        } else { // audio
          result = await piapiService.generateAudio(prompt, model as any, params, referenceUrl);
        }
      } catch (err) {
        console.error(`[useMediaGeneration] Erro ao gerar ${mediaType}:`, err);
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
      
      console.log(`[useMediaGeneration] Resultado inicial:`, result);
      
      // Registrar tarefa
      if (result && result.taskId) {
        const taskId = result.taskId;
        setCurrentTaskId(taskId);
        abortControllers.current[taskId] = controller;
        
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            taskId,
            progress: 0,
            status: result.status || 'pending',
            mediaUrl: result.mediaUrl,
            error: result.error
          }
        }));
        
        // Se já estiver completo (como no caso do DALL-E)
        if (result.status === 'completed' && result.mediaUrl) {
          if (options.onComplete) {
            options.onComplete({
              success: true,
              mediaUrl: result.mediaUrl,
              taskId: result.taskId
            });
          }
          
          if (options.showToasts !== false) {
            toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} gerado com sucesso!`);
          }
          
          return {
            success: true,
            mediaUrl: result.mediaUrl,
            taskId: result.taskId
          };
        }
        
        // Monitorar status periodicamente para tarefas pendentes
        const checkStatusInterval = setInterval(async () => {
          try {
            if (controller.signal.aborted) {
              clearInterval(checkStatusInterval);
              return;
            }
            
            console.log(`[useMediaGeneration] Verificando status da tarefa ${taskId}`);
            const statusResult = await piapiService.checkTaskStatus(taskId);
            console.log(`[useMediaGeneration] Status atual:`, statusResult);
            
            setTasks(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: statusResult.status,
                mediaUrl: statusResult.mediaUrl,
                error: statusResult.error,
                progress: prev[taskId]?.progress || 0 // Manter progresso atual
              }
            }));
            
            // Simular progresso se não tiver progresso real
            if (statusResult.status === 'pending' || statusResult.status === 'processing') {
              setTasks(prev => {
                const currentTask = prev[taskId];
                if (!currentTask) return prev;
                
                // Incrementar progresso gradualmente até 90%
                const newProgress = Math.min(90, (currentTask.progress || 0) + 5);
                
                if (options.onProgress) {
                  options.onProgress(newProgress);
                }
                
                return {
                  ...prev,
                  [taskId]: {
                    ...currentTask,
                    progress: newProgress
                  }
                };
              });
            }
            
            // Se completou ou falhou, parar monitoramento
            if (statusResult.status === 'completed' || statusResult.status === 'failed') {
              clearInterval(checkStatusInterval);
              
              // Definir progresso como 100% se concluído
              if (statusResult.status === 'completed') {
                setTasks(prev => ({
                  ...prev,
                  [taskId]: {
                    ...prev[taskId],
                    progress: 100
                  }
                }));
                
                if (options.onProgress) {
                  options.onProgress(100);
                }
              }
              
              // Salvar na galeria automaticamente se solicitado e se bem sucedido
              if (options.autoSaveToGallery !== false && 
                  statusResult.status === 'completed' && 
                  statusResult.mediaUrl) {
                try {
                  await mediaService.saveToGallery(
                    statusResult.mediaUrl,
                    prompt,
                    mediaType,
                    model as string,
                    user?.id
                  );
                  console.log('[useMediaGeneration] Media saved to gallery successfully');
                } catch (err) {
                  console.error('[useMediaGeneration] Error saving media to gallery:', err);
                }
              }
              
              // Notificar conclusão
              if (options.onComplete) {
                options.onComplete({
                  success: statusResult.status === 'completed',
                  error: statusResult.error,
                  mediaUrl: statusResult.mediaUrl,
                  taskId: statusResult.taskId
                });
              }
              
              // Notificar usuário
              if (options.showToasts !== false) {
                if (statusResult.status === 'completed') {
                  toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} gerado com sucesso!`);
                } else {
                  toast.error(`Erro ao gerar ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'vídeo' : 'áudio'}: ${statusResult.error || 'Erro desconhecido'}`);
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
        
        return {
          success: true,
          taskId: result.taskId
        };
      } else {
        // Nenhum taskId retornado
        const errorMsg = 'Nenhum ID de tarefa retornado pela API';
        console.error(`[useMediaGeneration] ${errorMsg}`);
        
        if (options.showToasts !== false) {
          toast.error(`Erro ao iniciar geração: ${errorMsg}`);
        }
        
        return {
          success: false,
          error: errorMsg
        };
      }
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
      const result = await piapiService.cancelTask(taskId);
      
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
