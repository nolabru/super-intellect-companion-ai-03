
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Type definitions for PiAPI service
 */
export type PiapiMediaType = 'image' | 'video' | 'audio';

export type PiapiImageModel = 
  'flux-dev' | 
  'flux-schnell' | 
  'dall-e-3' | 
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
 * Utility functions for error handling and validation
 */
const validatePrompt = (prompt: string, mediaType: PiapiMediaType): void => {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error(`O prompt não pode estar vazio para geração de ${mediaType}`);
  }
};

const validateImageParams = (params: PiapiParams): void => {
  if (params.width && (params.width < 256 || params.width > 1024)) {
    throw new Error("A largura deve estar entre 256 e 1024 pixels");
  }
  
  if (params.height && (params.height < 256 || params.height > 1024)) {
    throw new Error("A altura deve estar entre 256 e 1024 pixels");
  }
};

const handleApiError = (err: unknown, mediaType: string): never => {
  const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
  console.error(`[piapiService] Erro ao gerar ${mediaType}:`, err);
  toast.error(`Erro ao gerar ${mediaType}`, { description: errorMessage });
  throw err;
};

const normalizeTaskResponse = (data: any): PiapiTaskResult => {
  if (!data) {
    throw new Error('Resposta vazia da API');
  }
  
  const taskId = data.task_id || data.taskId;
  if (!taskId) {
    console.error('[piapiService] ID da tarefa não encontrado na resposta:', data);
    throw new Error('ID da tarefa não recebido');
  }
  
  return {
    taskId,
    status: data.status || 'pending',
    mediaUrl: data.media_url || data.mediaUrl || null
  };
};

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
      console.log(`[piapiService] Iniciando geração de imagem com modelo ${model}`);
      
      // Validar parâmetros
      validatePrompt(prompt, 'image');
      validateImageParams(params);
      
      // Definir endpoint baseado no modelo
      let endpoint = 'piapi-image-create-task';
      if (model === 'midjourney') {
        endpoint = 'piapi-midjourney-create-task';
      }
      
      // Enviar requisição
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { 
          prompt, 
          model, 
          params: {
            ...params,
            width: params.width || 768,
            height: params.height || 768
          }
        }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de imagem:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      console.log(`[piapiService] Resposta recebida:`, data);
      
      // Normalizar e retornar resposta
      return normalizeTaskResponse(data);
    } catch (err) {
      return handleApiError(err, 'imagem');
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
      console.log(`[piapiService] Iniciando geração de vídeo com modelo ${model}`);
      
      // Validar parâmetros
      validatePrompt(prompt, 'video');
      
      // Verificar se é necessário um imageUrl para modelos baseados em imagem
      if (model.includes('image') && !imageUrl) {
        throw new Error(`O modelo ${model} requer uma imagem de referência (imageUrl)`);
      }
      
      const { data, error } = await supabase.functions.invoke('piapi-video-create-task', {
        body: { prompt, model, imageUrl, params }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de vídeo:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      console.log(`[piapiService] Resposta de criação de vídeo:`, data);
      
      // Normalizar e retornar resposta
      return normalizeTaskResponse(data);
    } catch (err) {
      return handleApiError(err, 'vídeo');
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
      console.log(`[piapiService] Iniciando geração de áudio com modelo ${model}`);
      
      // Validar parâmetros
      if (model.includes('video2audio') && !videoUrl) {
        throw new Error("O modelo de conversão de vídeo para áudio requer uma URL de vídeo");
      }
      
      if (!model.includes('video2audio')) {
        validatePrompt(prompt, 'audio');
      }
      
      const { data, error } = await supabase.functions.invoke('piapi-audio-create-task', {
        body: { prompt, model, videoUrl, params }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao criar tarefa de áudio:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      console.log(`[piapiService] Resposta de criação de áudio:`, data);
      
      // Normalizar e retornar resposta
      return normalizeTaskResponse(data);
    } catch (err) {
      return handleApiError(err, 'áudio');
    }
  },
  
  /**
   * Verifica o status de uma tarefa
   */
  async checkTaskStatus(taskId: string): Promise<PiapiTaskResult> {
    try {
      console.log(`[piapiService] Verificando status da tarefa: ${taskId}`);
      
      if (!taskId) {
        throw new Error("ID da tarefa não fornecido");
      }
      
      const { data, error } = await supabase.functions.invoke('piapi-task-status', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao verificar status da tarefa:', error);
        throw new Error(`Erro ao verificar status: ${error.message}`);
      }
      
      console.log(`[piapiService] Resposta de status da tarefa:`, data);
      
      if (!data) {
        throw new Error('Resposta vazia da função');
      }
      
      // Normalizar resposta
      return {
        taskId: data.taskId || data.task_id || taskId,
        status: data.status || 'pending',
        mediaUrl: data.mediaUrl || data.media_url || null,
        error: data.error || null
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
      console.log(`[piapiService] Cancelando tarefa: ${taskId}`);
      
      if (!taskId) {
        throw new Error("ID da tarefa não fornecido");
      }
      
      const { data, error } = await supabase.functions.invoke('piapi-task-cancel', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[piapiService] Erro ao cancelar tarefa:', error);
        throw new Error(`Erro ao cancelar tarefa: ${error.message}`);
      }
      
      console.log(`[piapiService] Resposta de cancelamento:`, data);
      
      return data?.success || false;
    } catch (err) {
      console.error('[piapiService] Erro ao cancelar tarefa:', err);
      toast.error(`Erro ao cancelar tarefa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return false;
    }
  },
  
  /**
   * Inscreve-se para receber atualizações em tempo real sobre tarefas de mídia
   */
  subscribeToTaskUpdates(
    callback: (payload: any) => void
  ): () => void {
    console.log(`[piapiService] Configurando inscrição para atualizações de tarefas`);
    
    const subscription = supabase
      .channel('media-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_ready_events'
        },
        (payload) => {
          console.log(`[piapiService] Recebido evento de mídia pronta:`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`[piapiService] Status da inscrição: ${status}`);
      });
    
    return () => {
      console.log(`[piapiService] Removendo inscrição para atualizações de tarefas`);
      supabase.removeChannel(subscription);
    };
  }
};
