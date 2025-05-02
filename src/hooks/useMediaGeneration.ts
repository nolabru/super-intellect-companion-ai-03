
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  MediaGenerationParams, 
  MediaGenerationResult, 
  MediaGenerationTask, 
  MediaServiceOptions
} from '@/types/mediaGeneration';
import { supabase } from '@/integrations/supabase/client';

export function useMediaGeneration(options: MediaServiceOptions = { showToasts: true }) {
  const { showToasts, onTaskUpdate } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<MediaGenerationTask | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);

  // Verificar status da tarefa periodicamente
  const checkTaskStatus = useCallback(async (
    taskId: string,
    type: 'image' | 'video' | 'audio'
  ): Promise<MediaGenerationTask | null> => {
    try {
      const { data, error } = await supabase.from('piapi_tasks')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (error) {
        console.error('Erro ao verificar status da tarefa:', error);
        return null;
      }

      if (!data) return null;

      const task: MediaGenerationTask = {
        taskId: data.task_id,
        type,
        status: data.status as 'pending' | 'processing' | 'completed' | 'failed' | 'canceled',
        prompt: data.prompt || '',
        model: data.model,
        progress: data.percentage || 0,
        mediaUrl: data.media_url,
        error: data.error,
        metadata: data.params,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Atualizar estado com informações da tarefa
      setCurrentTask(task);
      setTaskProgress(task.progress);
      
      // Chamar callback externo se fornecido
      if (onTaskUpdate) {
        onTaskUpdate(task);
      }

      // Se concluído, definir URL de mídia e reinicializar estados
      if (task.status === 'completed' && task.mediaUrl) {
        setGeneratedMediaUrl(task.mediaUrl);
        if (showToasts) {
          toast.success(`Mídia ${type === 'image' ? 'imagem' : type === 'video' ? 'vídeo' : 'áudio'} gerada com sucesso!`);
        }
        setIsGenerating(false);
      } 
      // Se falhou, mostrar erro e reinicializar estados
      else if (task.status === 'failed') {
        if (showToasts) {
          toast.error(`Falha ao gerar ${type === 'image' ? 'imagem' : type === 'video' ? 'vídeo' : 'áudio'}: ${task.error || 'Erro desconhecido'}`);
        }
        setIsGenerating(false);
      }

      return task;
    } catch (error) {
      console.error('Erro ao verificar status da tarefa:', error);
      return null;
    }
  }, [onTaskUpdate, showToasts]);

  // Iniciar geração de mídia
  const generateMedia = useCallback(async (
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: MediaGenerationParams = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    try {
      setIsGenerating(true);
      setGeneratedMediaUrl(null);
      setTaskProgress(0);
      
      // Criar tarefa de geração de mídia
      const response = await supabase.functions.invoke('start-media-generation', {
        body: { type, prompt, model, params, referenceUrl }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro desconhecido ao iniciar geração de mídia');
      }

      const taskId = response.data.taskId;
      
      if (!taskId) {
        throw new Error('ID da tarefa não retornado pelo servidor');
      }

      // Inicializar tarefa atual
      const initialTask: MediaGenerationTask = {
        taskId,
        type,
        status: 'pending',
        prompt,
        model,
        progress: 0,
        metadata: params,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentTask(initialTask);
      
      // Iniciar monitoramento periódico
      const interval = setInterval(async () => {
        const updatedTask = await checkTaskStatus(taskId, type);
        
        // Se a tarefa estiver concluída ou falhou, interromper monitoramento
        if (updatedTask && (updatedTask.status === 'completed' || updatedTask.status === 'failed' || updatedTask.status === 'canceled')) {
          clearInterval(interval);
        }
      }, 3000);
      
      // Limpar intervalo quando componente for desmontado
      return { 
        success: true,
        taskId 
      };
    } catch (error) {
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (showToasts) {
        toast.error(`Erro ao gerar ${type === 'image' ? 'imagem' : type === 'video' ? 'vídeo' : 'áudio'}: ${errorMessage}`);
      }
      
      console.error('Erro ao iniciar geração de mídia:', error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [checkTaskStatus, showToasts]);

  // Cancelar geração em andamento
  const cancelGeneration = useCallback(async (): Promise<boolean> => {
    if (!currentTask) {
      return false;
    }

    try {
      // Chamar função para cancelar tarefa
      await supabase.functions.invoke('cancel-media-generation', {
        body: { taskId: currentTask.taskId }
      });

      // Atualizar estado da tarefa atual
      setCurrentTask(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          status: 'canceled',
          updatedAt: new Date()
        };
      });

      setIsGenerating(false);
      
      if (showToasts) {
        toast.info('Geração de mídia cancelada');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao cancelar geração:', error);
      
      if (showToasts) {
        toast.error('Erro ao cancelar geração de mídia');
      }
      
      return false;
    }
  }, [currentTask, showToasts]);

  // Dados de retorno do hook
  return {
    isGenerating,
    taskProgress,
    currentTask,
    generatedMediaUrl,
    generateMedia,
    cancelGeneration,
    checkTaskStatus
  };
}
