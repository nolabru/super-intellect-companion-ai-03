
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from './retryOperations';
import { toast } from 'sonner';

interface VideoRecoveryResult {
  success: boolean;
  url?: string;
  message: string;
  taskId?: string;
}

/**
 * Verifica se uma URL de vídeo é válida fazendo uma requisição HEAD
 * @param url URL do vídeo a ser verificada
 * @returns Promise<boolean> indicando se a URL é válida
 */
export const isVideoUrlValid = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    console.error('[isVideoUrlValid] Error checking video URL:', error);
    return false;
  }
};

/**
 * Busca informações sobre uma tarefa de geração de vídeo no banco de dados
 * @param taskId ID da tarefa
 * @returns Dados da tarefa ou null se não encontrada
 */
export const fetchTaskInfoFromDatabase = async (taskId: string): Promise<any> => {
  try {
    // Verificar primeiro na tabela piapi_tasks
    const { data: piapiTask, error: piapiError } = await supabase
      .from('piapi_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (piapiTask && !piapiError) {
      console.log(`[fetchTaskInfoFromDatabase] Encontrada tarefa em piapi_tasks: ${taskId}`);
      return piapiTask;
    }

    // Verificar na tabela apiframe_tasks se não encontrou na piapi_tasks
    const { data: apiframeTask, error: apiframeError } = await supabase
      .from('apiframe_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (apiframeTask && !apiframeError) {
      console.log(`[fetchTaskInfoFromDatabase] Encontrada tarefa em apiframe_tasks: ${taskId}`);
      return apiframeTask;
    }

    // Verificar se existe algum evento de media_ready_events relacionado
    const { data: mediaEvent, error: mediaEventError } = await supabase
      .from('media_ready_events')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (mediaEvent && !mediaEventError) {
      console.log(`[fetchTaskInfoFromDatabase] Encontrado evento de mídia: ${taskId}`);
      return {
        task_id: taskId,
        status: 'completed',
        media_url: mediaEvent.media_url,
        media_type: mediaEvent.media_type
      };
    }

    console.log(`[fetchTaskInfoFromDatabase] Tarefa não encontrada: ${taskId}`);
    return null;
  } catch (error) {
    console.error(`[fetchTaskInfoFromDatabase] Erro ao buscar tarefa ${taskId}:`, error);
    return null;
  }
};

/**
 * Recupera um vídeo verificando sua existência diretamente pela URL
 * e registra no banco de dados se necessário
 * @param videoUrl URL do vídeo a ser recuperada
 * @param taskId ID da tarefa (opcional)
 * @returns Resultado da recuperação
 */
export const recoverVideo = async (videoUrl: string, taskId?: string): Promise<VideoRecoveryResult> => {
  try {
    // Verificar se a URL é válida
    const isValid = await isVideoUrlValid(videoUrl);
    
    if (!isValid) {
      console.error(`[recoverVideo] URL inválida: ${videoUrl}`);
      return {
        success: false,
        message: 'A URL do vídeo não é válida ou não está acessível'
      };
    }
    
    console.log(`[recoverVideo] URL válida confirmada: ${videoUrl}`);
    
    // Se temos o taskId, verificar se já existe no banco e atualizar se necessário
    if (taskId) {
      const taskInfo = await fetchTaskInfoFromDatabase(taskId);
      
      // Se a tarefa existe mas não tem URL ou status não é completed, atualizar
      if (taskInfo && (!taskInfo.media_url || taskInfo.status !== 'completed')) {
        // Determinar qual tabela atualizar
        const table = taskInfo.hasOwnProperty('model') && taskInfo.model.includes('apiframe') 
          ? 'apiframe_tasks' 
          : 'piapi_tasks';
        
        // Atualizar a tarefa
        const { error: updateError } = await supabase
          .from(table)
          .update({
            status: 'completed',
            media_url: videoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('task_id', taskId);
        
        if (updateError) {
          console.error(`[recoverVideo] Erro ao atualizar tarefa ${taskId}:`, updateError);
        } else {
          console.log(`[recoverVideo] Tarefa ${taskId} atualizada com sucesso na tabela ${table}`);
        }
        
        // Criar um evento de mídia pronta se não existir
        const { data: existingEvent } = await supabase
          .from('media_ready_events')
          .select('*')
          .eq('task_id', taskId)
          .single();
        
        if (!existingEvent) {
          const { error: eventError } = await supabase
            .from('media_ready_events')
            .insert({
              task_id: taskId,
              media_type: 'video',
              media_url: videoUrl,
              prompt: taskInfo.prompt || '',
              model: taskInfo.model || 'unknown'
            });
          
          if (eventError) {
            console.error(`[recoverVideo] Erro ao criar evento de mídia pronta:`, eventError);
          } else {
            console.log(`[recoverVideo] Evento de mídia pronta criado com sucesso para ${taskId}`);
          }
        }
      }
    }
    
    // Retornar sucesso independentemente do resultado do banco
    return {
      success: true,
      url: videoUrl,
      taskId,
      message: 'Vídeo recuperado com sucesso'
    };
  } catch (error) {
    console.error('[recoverVideo] Erro ao recuperar vídeo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao recuperar vídeo',
      taskId
    };
  }
};

/**
 * Registra um vídeo recuperado no banco de dados para futuro acesso
 * @param videoUrl URL do vídeo
 * @param prompt Prompt usado para gerar o vídeo
 * @param userId ID do usuário
 * @returns Promise<boolean> indicando sucesso ou falha
 */
export const registerRecoveredVideo = async (
  videoUrl: string,
  prompt?: string,
  userId?: string
): Promise<boolean> => {
  try {
    if (!videoUrl) return false;
    
    const { error } = await supabase
      .from('media_gallery')
      .insert({
        media_url: videoUrl,
        prompt: prompt || 'Vídeo recuperado',
        media_type: 'video',
        model_id: 'recovered',
        user_id: userId
      });
    
    if (error) {
      console.error('[registerRecoveredVideo] Erro ao salvar na galeria:', error);
      return false;
    }
    
    toast.success('Vídeo salvo na galeria');
    return true;
  } catch (err) {
    console.error('[registerRecoveredVideo] Erro ao salvar na galeria:', err);
    return false;
  }
};
