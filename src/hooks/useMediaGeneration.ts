
import { useState, useCallback, useRef, useEffect } from 'react';
import { MediaGenerationResult } from '@/services/mediaService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import piapiDirectService, {
  PiapiMediaType, 
  PiapiModel, 
  PiapiParams,
  hasPiapiApiKey,
  initPiapiService
} from '@/services/piapiDirectService';

export interface UseMediaGenerationOptions {
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

export function useMediaGeneration(options: UseMediaGenerationOptions = {}) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Record<string, GenerationTask>>({});
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(hasPiapiApiKey());
  
  const abortControllers = useRef<Record<string, AbortController>>({});
  const statusCheckIntervals = useRef<Record<string, number>>({});

  // Clean up function
  useEffect(() => {
    return () => {
      // Cancel all abort controllers
      Object.values(abortControllers.current).forEach(controller => {
        try {
          controller.abort();
        } catch (err) {
          console.error('[useMediaGeneration] Error aborting controller:', err);
        }
      });
      
      // Clear all intervals
      Object.values(statusCheckIntervals.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
    };
  }, []);

  /**
   * Configure API key
   */
  const configureApiKey = useCallback((apiKey: string): boolean => {
    const result = initPiapiService(apiKey);
    setApiKeyConfigured(result);
    return result;
  }, []);

  /**
   * Check if API key is configured
   */
  const isApiKeyConfigured = useCallback((): boolean => {
    return hasPiapiApiKey();
  }, []);

  /**
   * Generate media using PiAPI direct service
   */
  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: PiapiMediaType,
    model: PiapiModel,
    params: PiapiParams = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    try {
      console.log(`[useMediaGeneration] Starting ${mediaType} generation with model ${model}`);
      
      if (!isApiKeyConfigured()) {
        toast.error('API key da PiAPI não configurada', {
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
      
      // Initialize generation with direct PiAPI service
      let result;
      
      try {
        // Call the appropriate method based on media type
        if (mediaType === 'image') {
          result = await piapiDirectService.generateImage(prompt, model as any, params);
        } else if (mediaType === 'video') {
          result = await piapiDirectService.generateVideo(prompt, model as any, params, referenceUrl);
        } else { // audio
          result = await piapiDirectService.generateAudio(prompt, model as any, params, referenceUrl);
        }
        
        console.log(`[useMediaGeneration] Initial result:`, result);
      } catch (err) {
        console.error(`[useMediaGeneration] Error in PiAPI service call:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        
        if (options.showToasts !== false) {
          toast.error(`Erro ao gerar ${mediaType}`, { description: errorMsg });
        }
        
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Register task if we have a task ID
      if (result && result.taskId) {
        const taskId = result.taskId;
        setCurrentTaskId(taskId);
        abortControllers.current[taskId] = controller;
        
        const taskObject: GenerationTask = {
          taskId,
          progress: 0,
          status: result.status || 'pending',
          mediaUrl: result.mediaUrl,
          error: result.error
        };
        
        console.log(`[useMediaGeneration] Registering new task:`, taskObject);
        
        setTasks(prev => ({
          ...prev,
          [taskId]: taskObject
        }));
        
        // If task is already completed (like with elevenlabs)
        if (result.status === 'completed' && result.mediaUrl) {
          console.log(`[useMediaGeneration] Task already complete with URL:`, result.mediaUrl);
          
          setTasks(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              progress: 100,
              mediaUrl: result.mediaUrl
            }
          }));
          
          if (options.onProgress) {
            options.onProgress(100);
          }
          
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
        
        // For pending tasks, set up status polling
        const checkStatusInterval = setInterval(async () => {
          try {
            // Check if aborted
            if (controller.signal.aborted) {
              clearInterval(checkStatusInterval);
              delete statusCheckIntervals.current[taskId];
              return;
            }
            
            console.log(`[useMediaGeneration] Checking status for task ${taskId}`);
            
            let statusResult;
            try {
              statusResult = await piapiDirectService.checkTaskStatus(taskId);
              console.log(`[useMediaGeneration] Status update:`, statusResult);
            } catch (statusError) {
              console.error(`[useMediaGeneration] Error checking status:`, statusError);
              return;
            }
            
            // Update task state with latest status
            setTasks(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: statusResult.status,
                mediaUrl: statusResult.mediaUrl,
                error: statusResult.error,
                // Maintain progress or increment it
                progress: statusResult.status === 'completed' ? 100 : 
                          calculateProgress(prev[taskId]?.progress || 0, statusResult.status)
              }
            }));
            
            // Update progress via callback
            if (options.onProgress) {
              options.onProgress(
                statusResult.status === 'completed' ? 100 : 
                calculateProgress(tasks[taskId]?.progress || 0, statusResult.status)
              );
            }
            
            // If completed or failed, clear interval and handle completion
            if (statusResult.status === 'completed' || statusResult.status === 'failed') {
              clearInterval(checkStatusInterval);
              delete statusCheckIntervals.current[taskId];
              
              // Notify completion
              if (options.onComplete) {
                options.onComplete({
                  success: statusResult.status === 'completed',
                  error: statusResult.error,
                  mediaUrl: statusResult.mediaUrl,
                  taskId: statusResult.taskId
                });
              }
              
              // Show toast notification
              if (options.showToasts !== false) {
                if (statusResult.status === 'completed') {
                  toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} gerado com sucesso!`);
                } else {
                  toast.error(`Erro ao gerar ${mediaType === 'image' ? 'imagem' : mediaType === 'video' ? 'vídeo' : 'áudio'}: ${statusResult.error || 'Erro desconhecido'}`);
                }
              }
            }
          } catch (err) {
            console.error('[useMediaGeneration] Error in status check interval:', err);
          }
        }, 3000); // Check every 3 seconds
        
        // Save interval ID for cleanup
        statusCheckIntervals.current[taskId] = checkStatusInterval as unknown as number;
        
        // Set timeout to auto-clear interval after 10 minutes
        setTimeout(() => {
          if (statusCheckIntervals.current[taskId]) {
            clearInterval(statusCheckIntervals.current[taskId]);
            delete statusCheckIntervals.current[taskId];
            
            // Update task if it's still pending
            setTasks(prev => {
              if (prev[taskId] && (prev[taskId].status === 'pending' || prev[taskId].status === 'processing')) {
                return {
                  ...prev,
                  [taskId]: {
                    ...prev[taskId],
                    status: 'failed',
                    error: 'Timeout: Task took too long to complete'
                  }
                };
              }
              return prev;
            });
            
            // Notify timeout via toast
            if (options.showToasts !== false) {
              toast.error(`Tempo esgotado para geração de ${mediaType}`, {
                description: 'A tarefa demorou muito tempo e será verificada em segundo plano'
              });
            }
          }
        }, 10 * 60 * 1000); // 10 minute timeout
        
        return {
          success: true,
          taskId: result.taskId
        };
      } else {
        // No task ID returned
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
      console.error('[useMediaGeneration] Error generating media:', err);
      
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
  }, [isApiKeyConfigured, options]);

  /**
   * Calculate progress based on current progress and status
   */
  const calculateProgress = (currentProgress: number, status: string): number => {
    if (status === 'pending') {
      // Increment by 5% up to 40% max for pending status
      return Math.min(40, currentProgress + 5);
    } else if (status === 'processing') {
      // Increment by 10% up to 90% max for processing status
      return Math.min(90, Math.max(50, currentProgress + 10));
    } else if (status === 'completed') {
      return 100;
    } else {
      return currentProgress;
    }
  };

  /**
   * Cancel a media generation task
   */
  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      if (!taskId) return false;
      
      console.log(`[useMediaGeneration] Cancelling task: ${taskId}`);
      
      // Abort controller if exists
      if (abortControllers.current[taskId]) {
        abortControllers.current[taskId].abort();
        delete abortControllers.current[taskId];
      }
      
      // Clear status check interval if exists
      if (statusCheckIntervals.current[taskId]) {
        clearInterval(statusCheckIntervals.current[taskId]);
        delete statusCheckIntervals.current[taskId];
      }
      
      // Cancel task in service
      const result = await piapiDirectService.cancelTask(taskId);
      
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
      console.error('[useMediaGeneration] Error cancelling task:', err);
      return false;
    }
  }, [options]);

  /**
   * Clear all tasks
   */
  const clearTasks = useCallback(() => {
    // Cancel all controllers
    Object.values(abortControllers.current).forEach(controller => {
      try {
        controller.abort();
      } catch (err) {
        console.error('[useMediaGeneration] Error aborting controller:', err);
      }
    });
    
    // Clear all intervals
    Object.values(statusCheckIntervals.current).forEach(intervalId => {
      clearInterval(intervalId);
    });
    
    abortControllers.current = {};
    statusCheckIntervals.current = {};
    setTasks({});
    setCurrentTaskId(null);
  }, []);

  return {
    generateMedia,
    cancelTask,
    clearTasks,
    configureApiKey,
    isApiKeyConfigured,
    isGenerating,
    tasks,
    currentTask: currentTaskId ? tasks[currentTaskId] : null,
    apiKeyConfigured
  };
}
