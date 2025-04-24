
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getPiapiService, PiapiMediaType, PiapiModel, PiapiParams } from '@/services/piapiDirectService';

interface UseMediaGenerationOptions {
  showToasts?: boolean;
}

export interface MediaGenerationTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
  progress: number;
}

export function useMediaGeneration(options: UseMediaGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<MediaGenerationTask | null>(null);

  const monitorTaskProgress = useCallback(async (taskId: string) => {
    const piapiService = getPiapiService();
    let progress = 0;
    let isCompleted = false;

    while (!isCompleted) {
      try {
        const result = await piapiService.checkTaskStatus(taskId);

        switch (result.status) {
          case 'completed':
            setCurrentTask({
              ...result,
              progress: 100
            });
            isCompleted = true;
            if (options.showToasts) {
              toast.success('Mídia gerada com sucesso');
            }
            break;

          case 'failed':
            setCurrentTask({
              ...result,
              progress: 100
            });
            isCompleted = true;
            if (options.showToasts && result.error) {
              toast.error('Falha ao gerar mídia', { description: result.error });
            }
            break;

          case 'processing':
            progress = Math.min(progress + 5, 95);
            setCurrentTask(prev => ({
              ...prev!,
              status: 'processing',
              progress
            }));
            break;

          default:
            progress = Math.min(progress + 2, 90);
            setCurrentTask(prev => ({
              ...prev!,
              progress
            }));
        }

        if (!isCompleted) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('[useMediaGeneration] Error monitoring task:', error);
        setCurrentTask(prev => ({
          ...prev!,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          progress: 100
        }));
        isCompleted = true;
        if (options.showToasts) {
          toast.error('Erro ao verificar status da geração');
        }
      }
    }

    setIsGenerating(false);
  }, [options.showToasts]);

  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: PiapiMediaType,
    model: PiapiModel,
    params: PiapiParams = {},
    referenceUrl?: string
  ) => {
    try {
      setIsGenerating(true);
      const piapiService = getPiapiService();

      let result;
      switch (mediaType) {
        case 'image':
          result = await piapiService.generateImage(prompt, model as any, params);
          break;
        case 'video':
          result = await piapiService.generateVideo(
            prompt, 
            model as any,
            params,
            referenceUrl
          );
          break;
        case 'audio':
          result = await piapiService.generateAudio(
            prompt,
            model as any,
            params,
            referenceUrl
          );
          break;
        default:
          throw new Error(`Unsupported media type: ${mediaType}`);
      }

      setCurrentTask({
        ...result,
        progress: 0
      });

      if (result.status === 'pending' || result.status === 'processing') {
        monitorTaskProgress(result.taskId);
      } else if (result.status === 'completed') {
        setCurrentTask({
          ...result,
          progress: 100
        });
        setIsGenerating(false);
        if (options.showToasts) {
          toast.success('Mídia gerada com sucesso');
        }
      }
    } catch (error) {
      console.error('[useMediaGeneration] Error generating media:', error);
      setIsGenerating(false);
      setCurrentTask({
        taskId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 100
      });
      if (options.showToasts) {
        toast.error('Erro ao gerar mídia', {
          description: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
  }, [monitorTaskProgress, options.showToasts]);

  const cancelGeneration = useCallback(async () => {
    if (currentTask?.taskId) {
      try {
        const piapiService = getPiapiService();
        const success = await piapiService.cancelTask(currentTask.taskId);
        
        if (success) {
          setCurrentTask(prev => ({
            ...prev!,
            status: 'failed',
            error: 'Task cancelled by user',
            progress: 100
          }));
          setIsGenerating(false);
          if (options.showToasts) {
            toast.info('Geração cancelada');
          }
        }
      } catch (error) {
        console.error('[useMediaGeneration] Error cancelling task:', error);
        if (options.showToasts) {
          toast.error('Erro ao cancelar geração');
        }
      }
    }
  }, [currentTask?.taskId, options.showToasts]);

  return {
    generateMedia,
    cancelGeneration,
    isGenerating,
    currentTask
  };
}
