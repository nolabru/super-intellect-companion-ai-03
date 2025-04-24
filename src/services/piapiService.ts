
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PiapiMediaType = 'image' | 'video' | 'audio';

export type PiapiImageModel = 
  'flux-dev' | 
  'flux-schnell' | 
  'dalle-3' | 
  'sdxl' | 
  'midjourney';

export type PiapiVideoModel = 
  'kling-text' | 
  'kling-image' | 
  'hunyuan-standard' | 
  'hunyuan-fast' | 
  'hailuo-text' | 
  'hailuo-image';

export type PiapiAudioModel = 
  'mmaudio-txt2audio' | 
  'mmaudio-video2audio' |
  'diffrhythm-base' | 
  'diffrhythm-full' | 
  'elevenlabs';

export type PiapiModel = PiapiImageModel | PiapiVideoModel | PiapiAudioModel;

export interface PiapiParams {
  [key: string]: any;
}

export interface PiapiTaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

/**
 * Serviço unificado para interagir com a PiAPI através das Edge Functions do Supabase
 */
export const piapiService = {
  /**
   * Gera uma imagem usando um dos modelos da PiAPI
   */
  async generateImage(
    prompt: string,
    model: PiapiImageModel = 'flux-schnell',
    params: PiapiParams = {}
  ): Promise<PiapiTaskResult> {
    try {
      const { data, error } = await supabase.functions.invoke('piapi-image-create-task', {
        body: { prompt, model, params }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de imagem:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      if (!data.task_id) {
        throw new Error('ID da tarefa não recebido');
      }
      
      console.log(`[piapiService] Tarefa de imagem criada: ${data.task_id}`);
      
      return {
        taskId: data.task_id,
        status: data.status || 'pending'
      };
    } catch (err) {
      console.error('[piapiService] Erro ao gerar imagem:', err);
      throw err;
    }
  },
  
  /**
   * Gera um vídeo usando um dos modelos da PiAPI
   */
  async generateVideo(
    prompt: string,
    model: PiapiVideoModel = 'kling-text',
    params: PiapiParams = {},
    imageUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      const { data, error } = await supabase.functions.invoke('piapi-video-create-task', {
        body: { prompt, model, imageUrl, params }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de vídeo:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      if (!data.task_id) {
        throw new Error('ID da tarefa não recebido');
      }
      
      console.log(`[piapiService] Tarefa de vídeo criada: ${data.task_id}`);
      
      return {
        taskId: data.task_id,
        status: data.status || 'pending'
      };
    } catch (err) {
      console.error('[piapiService] Erro ao gerar vídeo:', err);
      throw err;
    }
  },
  
  /**
   * Gera áudio usando um dos modelos da PiAPI
   */
  async generateAudio(
    prompt: string,
    model: PiapiAudioModel = 'diffrhythm-base',
    params: PiapiParams = {},
    videoUrl?: string
  ): Promise<PiapiTaskResult> {
    try {
      const { data, error } = await supabase.functions.invoke('piapi-audio-create-task', {
        body: { prompt, model, videoUrl, params }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de áudio:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      if (!data.task_id) {
        throw new Error('ID da tarefa não recebido');
      }
      
      console.log(`[piapiService] Tarefa de áudio criada: ${data.task_id}`);
      
      return {
        taskId: data.task_id,
        status: data.status || 'pending'
      };
    } catch (err) {
      console.error('[piapiService] Erro ao gerar áudio:', err);
      throw err;
    }
  },
  
  /**
   * Verifica o status de uma tarefa
   */
  async checkTaskStatus(taskId: string): Promise<PiapiTaskResult> {
    try {
      const { data, error } = await supabase.functions.invoke('piapi-task-status', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao verificar status da tarefa:', error);
        throw new Error(`Erro ao verificar status: ${error.message}`);
      }
      
      return {
        taskId: data.taskId,
        status: data.status,
        mediaUrl: data.mediaUrl,
        error: data.error
      };
    } catch (err) {
      console.error('[piapiService] Erro ao verificar status:', err);
      throw err;
    }
  },
  
  /**
   * Cancela uma tarefa em andamento
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('piapi-task-cancel', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao cancelar tarefa:', error);
        throw new Error(`Erro ao cancelar tarefa: ${error.message}`);
      }
      
      return data.success || false;
    } catch (err) {
      console.error('[piapiService] Erro ao cancelar tarefa:', err);
      return false;
    }
  },
  
  /**
   * Inscreve-se para receber atualizações em tempo real sobre tarefas de mídia
   */
  subscribeToTaskUpdates(
    callback: (payload: any) => void
  ): () => void {
    const subscription = supabase
      .channel('media-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_ready_events'
        },
        callback
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }
};
