
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { withRetry } from '@/utils/retryOperations';

export type SunoModel = 'chirp-v3-0' | 'chirp-v3-5' | 'chirp-v4';

export interface SunoParams {
  prompt?: string;
  lyrics?: string;
  model?: SunoModel;
  make_instrumental?: boolean;
  title?: string;
  tags?: string;
}

export interface SunoSong {
  lyrics?: string;
  song_id?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
}

export interface SunoTaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'finished' | 'failed';
  songs?: SunoSong[];
  error?: string;
  percentage?: number;
}

/**
 * Serviço para interação com a API SUNO através do APIFRAME
 */
export const sunoService = {
  /**
   * Cria uma tarefa para gerar música usando a API SUNO
   */
  async generateMusic(params: SunoParams): Promise<SunoTaskResult> {
    try {
      console.log(`[sunoService] Iniciando geração de música com modelo ${params.model || 'chirp-v4'}`);
      
      if (!params.prompt && !params.lyrics) {
        throw new Error("É necessário fornecer um prompt ou letras para gerar a música");
      }
      
      // Obter o domínio para o webhook
      const { data: { url: supabaseUrl } } = await supabase.functions.invoke('get-supabase-url', {});
      const webhookUrl = `${supabaseUrl}/functions/v1/apiframe-media-webhook`;
      
      // Montar o payload com o webhook
      const payload = {
        ...params,
        webhook_url: webhookUrl,
      };
      
      console.log(`[sunoService] Enviando requisição para SUNO API via APIFrame`);
      
      // Chamar a edge function para criar a tarefa
      const { data, error } = await supabase.functions.invoke('apiframe-suno-create-task', {
        body: payload
      });
      
      if (error) {
        console.error('[sunoService] Erro ao criar tarefa:', error);
        throw new Error(`Erro ao criar tarefa: ${error.message}`);
      }
      
      if (!data.success) {
        console.error('[sunoService] Erro retornado pela API:', data.error);
        throw new Error(data.error || 'Erro ao criar tarefa');
      }
      
      console.log(`[sunoService] Tarefa criada com sucesso: ${data.taskId}`);
      
      return {
        taskId: data.taskId,
        status: data.status || 'pending',
        songs: data.songs || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[sunoService] Erro ao gerar música:`, err);
      toast.error(`Erro ao gerar música: ${errorMessage}`);
      throw err;
    }
  },
  
  /**
   * Verifica o status de uma tarefa de geração de música
   */
  async checkTaskStatus(taskId: string): Promise<SunoTaskResult> {
    try {
      return await withRetry(async () => {
        console.log(`[sunoService] Verificando status da tarefa: ${taskId}`);
        
        if (!taskId) {
          throw new Error("ID da tarefa não fornecido");
        }
        
        const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
          body: { taskId, forceCheck: true }
        });
        
        if (error) {
          console.error('[sunoService] Erro ao verificar status da tarefa:', error);
          throw new Error(`Erro ao verificar status: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('Resposta vazia da função');
        }
        
        console.log(`[sunoService] Status da tarefa ${taskId}: ${data.status}`);
        
        return {
          taskId: data.taskId || taskId,
          status: data.status || 'pending',
          songs: data.songs || [],
          percentage: data.percentage || 0,
          error: data.error
        };
      }, {
        maxRetries: 2,
        retryCondition: (error) => {
          // Não tentar novamente para erros específicos
          return !error.message?.includes('não encontrada');
        }
      });
    } catch (err) {
      console.error('[sunoService] Erro ao verificar status:', err);
      return {
        taskId,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    }
  },
  
  /**
   * Cancela uma tarefa de geração de música
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      console.log(`[sunoService] Cancelando tarefa: ${taskId}`);
      
      if (!taskId) {
        throw new Error("ID da tarefa não fornecido");
      }
      
      const { data, error } = await supabase.functions.invoke('apiframe-task-cancel', {
        body: { taskId }
      });
      
      if (error) {
        console.error('[sunoService] Erro ao cancelar tarefa:', error);
        throw new Error(`Erro ao cancelar tarefa: ${error.message}`);
      }
      
      return data?.success || false;
    } catch (err) {
      console.error('[sunoService] Erro ao cancelar tarefa:', err);
      return false;
    }
  }
};
