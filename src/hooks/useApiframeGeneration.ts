
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiframeService } from '@/services/apiframeService';
import { UseMediaGenerationOptions, ApiframeMediaType, ApiframeModel, ApiframeParams } from '@/types/apiframeGeneration';
import { useTaskState } from './apiframe/useTaskState';
import { useTaskCleanup } from './apiframe/useTaskCleanup';
import { calculateProgress } from '@/utils/apiframeProgress';

/**
 * Hook for generating media through APIframe.ai
 */
export function useApiframeGeneration(options: UseMediaGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(apiframeService.isApiKeyConfigured());
  
  const {
    tasks,
    currentTaskId,
    currentTask,
    updateTask,
    registerTask,
    clearTasks
  } = useTaskState();
  
  const { abortControllers, statusCheckIntervals } = useTaskCleanup(options);

  const configureApiKey = useCallback((apiKey: string): boolean => {
    const result = apiframeService.setApiKey(apiKey);
    setApiKeyConfigured(result);
    return result;
  }, []);

  const isApiKeyConfigured = useCallback((): boolean => {
    return apiframeService.isApiKeyConfigured();
  }, []);

  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: ApiframeMediaType,
    model: ApiframeModel,
    params: ApiframeParams = {},
    referenceUrl?: string
  ) => {
    try {
      console.log(`[useApiframeGeneration] Starting ${mediaType} generation with model ${model}`);
      
      if (!isApiKeyConfigured()) {
        toast.error('API key da APIframe não configurada', {
          description: 'Configure sua chave de API nas configurações'
        });
        return {
          success: false,
          error: 'API key not configured'
        };
      }
      
      setIsGenerating(true);
      
      if (options.showToasts !== false) {
        toast.info(`Iniciando geração de ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'vídeo' : 'áudio'}...`);
      }
      
      // Create controller for possible cancelation
      const controller = new AbortController();
      
      let result;
      try {
        if (mediaType === 'image') {
          result = await apiframeService.generateImage(prompt, model, params);
        } else if (mediaType === 'video') {
          result = await apiframeService.generateVideo(prompt, model, params, referenceUrl);
        } else {
          result = await apiframeService.generateAudio(prompt, model, params, referenceUrl);
        }
      } catch (err) {
        console.error(`[useApiframeGeneration] Error in APIframe service call:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        
        if (options.showToasts !== false) {
          toast.error(`Erro ao gerar ${mediaType}`, { description: errorMsg });
        }
        
        return {
          success: false,
          error: errorMsg
        };
      }
      
      if (result && result.taskId) {
        const taskId = result.taskId;
        abortControllers[taskId] = controller;
        
        registerTask(taskId, {
          taskId,
          progress: 0,
          status: result.status || 'pending',
          mediaUrl: result.mediaUrl,
          error: result.error
        });
        
        if (result.status === 'completed' && result.mediaUrl) {
          handleTaskCompletion(taskId, result.mediaUrl);
          return {
            success: true,
            mediaUrl: result.mediaUrl,
            taskId: result.taskId
          };
        }
        
        // Set up status polling for pending tasks
        setupStatusPolling(taskId);
        
        return {
          success: true,
          taskId: result.taskId
        };
      }
      
      const errorMsg = 'Nenhum ID de tarefa retornado pela API';
      console.error(`[useApiframeGeneration] ${errorMsg}`);
      
      if (options.showToasts !== false) {
        toast.error(`Erro ao iniciar geração: ${errorMsg}`);
      }
      
      return {
        success: false,
        error: errorMsg
      };
    } catch (err) {
      console.error('[useApiframeGeneration] Error generating media:', err);
      
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
  }, [isApiKeyConfigured, options, registerTask]);

  const handleTaskCompletion = useCallback((taskId: string, mediaUrl: string) => {
    updateTask(taskId, {
      progress: 100,
      status: 'completed',
      mediaUrl
    });
    
    if (options.onProgress) {
      options.onProgress(100);
    }
    
    if (options.onComplete) {
      options.onComplete({
        success: true,
        mediaUrl,
        taskId
      });
    }
    
    if (options.showToasts !== false) {
      toast.success('Mídia gerada com sucesso!');
    }
  }, [options, updateTask]);

  const setupStatusPolling = useCallback((taskId: string) => {
    const checkStatusInterval = setInterval(async () => {
      if (abortControllers[taskId]?.signal.aborted) {
        clearInterval(statusCheckIntervals[taskId]);
        delete statusCheckIntervals[taskId];
        return;
      }

      try {
        const statusResult = await apiframeService.checkTaskStatus(taskId);
        
        updateTask(taskId, {
          status: statusResult.status,
          mediaUrl: statusResult.mediaUrl,
          error: statusResult.error,
          progress: calculateProgress(tasks[taskId]?.progress || 0, statusResult.status)
        });
        
        if (options.onProgress) {
          options.onProgress(
            statusResult.status === 'completed' ? 100 : 
            calculateProgress(tasks[taskId]?.progress || 0, statusResult.status)
          );
        }
        
        if (statusResult.status === 'completed' || statusResult.status === 'failed') {
          clearInterval(statusCheckIntervals[taskId]);
          delete statusCheckIntervals[taskId];
          
          if (statusResult.status === 'completed' && statusResult.mediaUrl) {
            handleTaskCompletion(taskId, statusResult.mediaUrl);
          } else if (options.showToasts !== false) {
            toast.error(`Erro ao gerar mídia: ${statusResult.error || 'Erro desconhecido'}`);
          }
        }
      } catch (err) {
        console.error('[useApiframeGeneration] Error in status check:', err);
      }
    }, 3000);
    
    statusCheckIntervals[taskId] = checkStatusInterval as unknown as number;
    
    // Auto-clear interval after 10 minutes
    setTimeout(() => {
      if (statusCheckIntervals[taskId]) {
        clearInterval(statusCheckIntervals[taskId]);
        delete statusCheckIntervals[taskId];
        
        updateTask(taskId, {
          status: 'failed',
          error: 'Timeout: Task took too long to complete'
        });
        
        if (options.showToasts !== false) {
          toast.error('Tempo esgotado para geração de mídia', {
            description: 'A tarefa demorou muito tempo e será verificada em segundo plano'
          });
        }
      }
    }, 10 * 60 * 1000);
  }, [tasks, options, updateTask]);

  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      if (!taskId) return false;
      
      console.log(`[useApiframeGeneration] Cancelling task: ${taskId}`);
      
      if (abortControllers[taskId]) {
        abortControllers[taskId].abort();
        delete abortControllers[taskId];
      }
      
      if (statusCheckIntervals[taskId]) {
        clearInterval(statusCheckIntervals[taskId]);
        delete statusCheckIntervals[taskId];
      }
      
      const result = await apiframeService.cancelTask(taskId);
      
      if (result) {
        updateTask(taskId, {
          status: 'failed',
          error: 'Tarefa cancelada pelo usuário'
        });
        
        if (options.showToasts !== false) {
          toast.info('Tarefa de geração cancelada');
        }
      }
      
      return result;
    } catch (err) {
      console.error('[useApiframeGeneration] Error cancelling task:', err);
      return false;
    }
  }, [options, updateTask]);

  return {
    generateMedia,
    cancelTask,
    clearTasks,
    configureApiKey,
    isApiKeyConfigured,
    isGenerating,
    tasks,
    currentTask,
    apiKeyConfigured
  };
}
