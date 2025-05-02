import { supabase } from '@/integrations/supabase/client';
import { piapiService, PiapiMediaType, PiapiModel, PiapiParams } from './piapiService';
import { tokenService } from './tokenService';
import { toast } from 'sonner';

export interface MediaGenerationResult {
  success: boolean;
  taskId?: string;
  status?: string;
  mediaUrl?: string;
  error?: string;
}

export interface MediaGenerationOptions {
  userId?: string;
  shouldCheckTokens?: boolean;
  shouldTrackProgress?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Serviço para gerenciamento de geração e armazenamento de mídia
 */
export const mediaService = {
  /**
   * Gera mídia através da PiAPI com monitoramento e controle de tokens
   */
  async generateMedia(
    prompt: string,
    mediaType: PiapiMediaType,
    model: PiapiModel,
    params: PiapiParams = {},
    options: MediaGenerationOptions = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> {
    try {
      console.log(`[mediaService] Iniciando geração de ${mediaType} com modelo ${model}`);
      
      // Verificar tokens se solicitado e usuário autenticado
      if (options.shouldCheckTokens && options.userId) {
        const { hasEnough, required, remaining } = await tokenService.hasEnoughTokens(
          options.userId,
          model as string,
          mediaType
        );
        
        if (!hasEnough) {
          console.error(`[mediaService] Tokens insuficientes. Necessário: ${required}, Disponível: ${remaining}`);
          return {
            success: false,
            error: `Tokens insuficientes para esta operação. Necessário: ${required}, Disponível: ${remaining}`
          };
        }
        
        console.log(`[mediaService] Verificação de tokens aprovada. Disponível: ${remaining}`);
      }
      
      // Iniciar geração de mídia com o serviço adequado
      let result;
      switch (mediaType) {
        case 'image':
          result = await piapiService.generateImage(prompt, model as any, params);
          break;
        case 'video':
          result = await piapiService.generateVideo(prompt, model as any, params, referenceUrl);
          break;
        case 'audio':
          result = await piapiService.generateAudio(prompt, model as any, params, referenceUrl);
          break;
        default:
          throw new Error(`Tipo de mídia não suportado: ${mediaType}`);
      }
      
      console.log(`[mediaService] Tarefa de geração criada: ${result.taskId}`);
      
      // Monitorar progresso da tarefa se solicitado
      if (options.shouldTrackProgress) {
        this._monitorTaskProgress(result.taskId, mediaType, options.onProgress);
      }
      
      return {
        success: true,
        taskId: result.taskId,
        status: result.status
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[mediaService] Erro ao gerar ${mediaType}:`, err);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  /**
   * Verifica o status de uma tarefa de geração de mídia
   */
  async checkTaskStatus(taskId: string): Promise<MediaGenerationResult> {
    try {
      const result = await piapiService.checkTaskStatus(taskId);
      
      return {
        success: true,
        taskId: result.taskId,
        status: result.status,
        mediaUrl: result.mediaUrl,
        error: result.error
      };
    } catch (err) {
      console.error('[mediaService] Erro ao verificar status da tarefa:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao verificar status da tarefa'
      };
    }
  },
  
  /**
   * Cancela uma tarefa de geração de mídia
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[mediaService] Solicitando cancelamento da tarefa ${taskId}`);
      return await piapiService.cancelTask(taskId);
    } catch (err) {
      console.error('[mediaService] Erro ao cancelar tarefa:', err);
      return false;
    }
  },
  
  /**
   * Salva uma mídia na galeria do usuário
   */
  async saveToGallery(
    mediaUrl: string, 
    prompt: string, 
    mediaType: PiapiMediaType, 
    modelId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      if (!mediaUrl) {
        console.error('[mediaService] URL de mídia não fornecida');
        return false;
      }
      
      console.log(`[mediaService] Salvando mídia ${mediaType} na galeria`);
      
      const { error } = await supabase
        .from('media_gallery')
        .insert({
          media_url: mediaUrl,
          prompt,
          media_type: mediaType,
          model_id: modelId,
          user_id: userId
        });
      
      if (error) {
        console.error('[mediaService] Erro ao salvar na galeria:', error);
        return false;
      }
      
      toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} salvo na galeria`);
      return true;
    } catch (err) {
      console.error('[mediaService] Erro ao salvar na galeria:', err);
      return false;
    }
  },
  
  /**
   * Obtém itens da galeria do usuário
   */
  async getGalleryItems(
    userId?: string, 
    mediaType?: PiapiMediaType,
    limit: number = 20
  ): Promise<any[]> {
    try {
      console.log(`[mediaService] Obtendo ${limit} itens da galeria`);
      
      let query = supabase
        .from('media_gallery')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (mediaType) {
        query = query.eq('media_type', mediaType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[mediaService] Erro ao obter itens da galeria:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('[mediaService] Erro ao obter itens da galeria:', err);
      return [];
    }
  },
  
  /**
   * Configura monitoramento de progresso para uma tarefa
   */
  _monitorTaskProgress(
    taskId: string, 
    mediaType: PiapiMediaType,
    onProgress?: (progress: number) => void
  ): void {
    let progress = 0;
    let cancelled = false;
    
    const updateProgressInterval = setInterval(async () => {
      if (cancelled || progress >= 100) {
        clearInterval(updateProgressInterval);
        return;
      }
      
      try {
        const result = await this.checkTaskStatus(taskId);
        
        if (result.status === 'completed') {
          progress = 100;
          if (onProgress) onProgress(progress);
          clearInterval(updateProgressInterval);
        } else if (result.status === 'failed') {
          clearInterval(updateProgressInterval);
        } else {
          // Incrementar progresso gradualmente
          progress = Math.min(progress + 5, 95);
          if (onProgress) onProgress(progress);
        }
      } catch (err) {
        console.error('[mediaService] Erro ao atualizar progresso:', err);
      }
    }, 2000);
    
    // Inscrever-se para atualizações em tempo real
    const unsubscribe = piapiService.subscribeToTaskUpdates((payload) => {
      const { task_id, media_url, error } = payload.new;
      
      if (task_id === taskId) {
        clearInterval(updateProgressInterval);
        
        if (!error && media_url) {
          progress = 100;
          if (onProgress) onProgress(progress);
        }
        
        unsubscribe();
      }
    });
    
    // Garantir que recursos são liberados
    setTimeout(() => {
      cancelled = true;
      clearInterval(updateProgressInterval);
      unsubscribe();
    }, 5 * 60 * 1000); // Timeout após 5 minutos
  }
};

/**
 * Salva uma mídia na galeria do usuário
 */
export const saveToGallery = async (
  mediaUrl: string, 
  prompt: string, 
  mediaType: string, 
  modelId: string,
  userId?: string
): Promise<boolean> => {
  try {
    if (!mediaUrl) {
      console.error('[mediaService] URL de mídia não fornecida');
      return false;
    }
    
    console.log(`[mediaService] Salvando mídia ${mediaType} na galeria`);
    
    const { error } = await supabase
      .from('media_gallery')
      .insert({
        media_url: mediaUrl,
        prompt,
        media_type: mediaType,
        model_id: modelId,
        user_id: userId
      });
    
    if (error) {
      console.error('[mediaService] Erro ao salvar na galeria:', error);
      return false;
    }
    
    toast.success(`${mediaType === 'image' ? 'Imagem' : mediaType === 'video' ? 'Vídeo' : 'Áudio'} salvo na galeria`);
    return true;
  } catch (err) {
    console.error('[mediaService] Erro ao salvar na galeria:', err);
    return false;
  }
};
