import { useTaskManager, Task } from '@/hooks/useSimplifiedTaskManager';
import { useSimplifiedMediaGeneration } from '@/hooks/useSimplifiedMediaGeneration';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sunoService } from '@/services/sunoService';

export interface MediaServiceOptions {
  service: 'ideogram' | 'auto';
  showToasts?: boolean;
  onTaskUpdate?: (task: Task) => void;
}

type MediaTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface MediaTaskStatusResponse {
  success: boolean;
  taskId?: string;
  status: MediaTaskStatus;
  mediaUrl?: string;
  error?: string;
  percentage?: number;
}

type MediaServiceType = 'piapi' | 'apiframe' | 'suno' | 'openai' | 'elevenLabs' | 'auto';

interface PiapiTaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}

const mapPiapiStatus = (status: string): MediaTaskStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'processing': return 'processing';
    case 'completed': return 'completed';
    case 'failed': return 'failed';
    default: return 'pending';
  }
};

/**
 * Adapter for media generation services
 * Creates a standardized interface for media generation
 */
export function useMediaServiceAdapter(options: MediaServiceOptions = { service: 'auto' }) {
  const {
    service = 'auto',
    showToasts = true,
    onTaskUpdate
  } = options;
  
  // Initialize the service
  const ideogramService = useSimplifiedMediaGeneration({ showToasts: false });
  
  // Get task manager for handling operations
  const taskManager = useTaskManager({
    showToasts,
    maxConcurrentTasks: 2,
    onTaskComplete: onTaskUpdate,
    onTaskFail: onTaskUpdate,
    onTaskStart: onTaskUpdate
  });

  // Register task processor for image generation
  taskManager.registerTaskProcessor('image', async (task: Task) => {
    try {
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType: 'ideogram'
        },
        progress: 10
      });
      
      // For now we only support Ideogram image generation
      const mediaUrl = await ideogramService.generateMedia(
        task.prompt,
        'image',
        task.model,
        task.metadata?.params || {},
        task.metadata?.referenceUrl
      );
      
      if (mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: mediaUrl
        };
      } else {
        throw new Error('No image was generated');
      }
    } catch (error) {
      console.error('[mediaServiceAdapter] Error generating image:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Register video processor using API Frame
  taskManager.registerTaskProcessor('video', async (task: Task) => {
    try {
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          serviceType: 'apiframe-video'
        },
        progress: 5,
        status: 'processing'
      });
      
      const params = task.metadata?.params || {};
      const referenceUrl = task.metadata?.referenceUrl;
      const isImageToVideo = params.videoType === 'image-to-video' || !!referenceUrl;
      
      // Call the apiframe-video-create-task function
      const { data, error } = await supabase.functions.invoke('apiframe-video-create-task', {
        body: {
          prompt: task.prompt,
          model: task.model,
          imageUrl: referenceUrl, // Pass the reference image if it's an image-to-video task
          params: params
        }
      });
      
      if (error) {
        console.error('[mediaServiceAdapter] Error creating video task:', error);
        throw new Error(`Error creating video task: ${error.message || 'Unknown error'}`);
      }
      
      if (!data.success || !data.taskId) {
        console.error('[mediaServiceAdapter] Invalid response from video task creation:', data);
        throw new Error('Failed to start video generation');
      }
      
      // Update task with task ID from API Frame
      taskManager.updateTask(task.id, {
        metadata: {
          ...task.metadata,
          apiframeTaskId: data.taskId
        },
        progress: 15,
        status: 'processing'
      });
      
      // Start polling for status updates
      const maxPolls = 120; // Maximum number of polls (20 minutes at 10s intervals, increased from 10 minutes)
      let pollCount = 0;
      
      // Run initial poll immediately for faster response
      const initialResult = await checkVideoTaskStatus(data.taskId);
      if (initialResult.mediaUrl) {
        return {
          ...task,
          status: 'completed',
          progress: 100,
          result: initialResult.mediaUrl
        };
      }
      
      // If not already complete, start polling
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            pollCount++;
            
            // Check task status
            const result = await checkVideoTaskStatus(data.taskId);
            
            // Update progress based on poll count if no percentage available
            const estimatedProgress = Math.min(15 + (pollCount * 0.7), 95); // Adjusted to spread over 20 minutes
            
            // Update task status
            taskManager.updateTask(task.id, {
              progress: result.percentage || estimatedProgress,
              status: result.status || 'processing'
            });
            
            // If complete, resolve with result
            if (result.status === 'completed' && result.mediaUrl) {
              clearInterval(pollInterval);
              resolve({
                ...task,
                status: 'completed',
                progress: 100,
                result: result.mediaUrl
              });
            } 
            // If failed, reject with error
            else if (result.status === 'failed') {
              clearInterval(pollInterval);
              reject(new Error(result.error || 'Video generation failed'));
            }
            // If reached max polls, time out
            else if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              reject(new Error('Video generation timed out after 20 minutes'));
            }
          } catch (error) {
            console.error('[mediaServiceAdapter] Error polling video task status:', error);
            // Don't stop polling on a single error
          }
        }, 10000); // Poll every 10 seconds
      });
    } catch (error) {
      console.error('[mediaServiceAdapter] Error in video task processor:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
  
  // Register audio processor for music generation using SUNO API
  taskManager.registerTaskProcessor('audio', async (task: Task) => {
    try {
      const isSunoMusic = task.metadata?.params?.audioType === 'music' || 
                          task.model?.includes('suno') || 
                          task.model?.includes('chirp');
      
      if (isSunoMusic) {
        // Esta é uma solicitação de música, vamos usar a API SUNO
        taskManager.updateTask(task.id, {
          metadata: {
            ...task.metadata,
            serviceType: 'suno-music'
          },
          progress: 5,
          status: 'processing'
        });
        
        // Preparar os parâmetros para a API SUNO
        const params = {
          prompt: task.prompt,
          lyrics: task.metadata?.params?.lyrics,
          model: task.metadata?.params?.sunoModel || 'chirp-v4',
          make_instrumental: task.metadata?.params?.instrumental || false,
          title: task.metadata?.params?.title,
          tags: task.metadata?.params?.tags
        };
        
        // Chamar o serviço SUNO para criar a tarefa
        const sunoResult = await sunoService.generateMusic(params);
        
        // Atualizar a tarefa com o ID da tarefa SUNO
        taskManager.updateTask(task.id, {
          metadata: {
            ...task.metadata,
            sunoTaskId: sunoResult.taskId
          },
          progress: 15,
          status: 'processing'
        });
        
        // Se já temos músicas na resposta (improvável), retornar imediatamente
        if (sunoResult.status === 'finished' && sunoResult.songs && sunoResult.songs.length > 0) {
          return {
            ...task,
            status: 'completed',
            progress: 100,
            result: sunoResult.songs[0].video_url || sunoResult.songs[0].audio_url
          };
        }
        
        // Iniciar polling para atualizações de status
        const maxPolls = 360; // 30 minutos em intervalos de 5 segundos
        let pollCount = 0;
        
        return new Promise((resolve, reject) => {
          const pollInterval = setInterval(async () => {
            try {
              pollCount++;
              
              // Verificar status da tarefa
              const result = await sunoService.checkTaskStatus(sunoResult.taskId);
              
              // Atualizar progresso com base na contagem de polling se não houver porcentagem disponível
              const estimatedProgress = Math.min(15 + (pollCount * 0.2), 95);
              
              // Atualizar status da tarefa
              taskManager.updateTask(task.id, {
                progress: result.percentage || estimatedProgress,
                status: result.status || 'processing'
              });
              
              // Se concluído, resolver com resultado
              if (result.status === 'finished' && result.songs && result.songs.length > 0) {
                clearInterval(pollInterval);
                
                // Preferir o vídeo com letra, mas usar áudio se o vídeo não estiver disponível
                const mediaUrl = result.songs[0].video_url || result.songs[0].audio_url;
                
                if (!mediaUrl) {
                  reject(new Error("Nenhuma URL de mídia disponível na resposta"));
                  return;
                }
                
                resolve({
                  ...task,
                  status: 'completed',
                  progress: 100,
                  result: mediaUrl
                });
              }
              // Se falhou, rejeitar com erro
              else if (result.status === 'failed') {
                clearInterval(pollInterval);
                reject(new Error(result.error || 'Falha na geração de música'));
              }
              // Se atingiu o número máximo de polls, timeout
              else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                reject(new Error('Geração de música atingiu o tempo limite após 30 minutos'));
              }
            } catch (error) {
              console.error('[mediaServiceAdapter] Erro ao verificar status da tarefa SUNO:', error);
              // Não interromper o polling por um único erro
            }
          }, 5000); // Verificar a cada 5 segundos
        });
      } else {
        // Para outros tipos de áudio, usar implementação atual
        return {
          ...task,
          status: 'failed',
          progress: 0,
          error: 'Geração de áudio genérico não está implementada ainda'
        };
      }
    } catch (error) {
      console.error('[mediaServiceAdapter] Erro no processador de tarefa de áudio:', error);
      return {
        ...task,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  });
  
  // Helper function to check video task status
  const checkVideoTaskStatus = async (taskId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
        body: { taskId }
      });
      
      if (error) {
        throw error;
      }
      
      return {
        status: data.status,
        mediaUrl: data.mediaUrl,
        error: data.error,
        percentage: data.percentage || 0
      };
    } catch (error) {
      console.error('[mediaServiceAdapter] Error checking task status:', error);
      throw error;
    }
  };

  // Main public methods
  return {
    // Main method to generate any type of media
    generateMedia: (
      type: 'image' | 'video' | 'audio',
      prompt: string,
      model: string,
      params: any = {},
      referenceUrl?: string
    ) => {
      const taskId = taskManager.createTask(
        type,
        model,
        prompt,
        {
          params,
          referenceUrl
        }
      );
      
      if (showToasts) {
        toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started`, {
          description: 'Your request has been queued'
        });
      }
      
      return taskId;
    },
    
    // Shortcuts for specific media types
    generateImage: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('image', model, prompt, { params, referenceUrl }),
      
    generateVideo: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('video', model, prompt, { params, referenceUrl }),
      
    generateAudio: (prompt: string, model: string, params?: any, referenceUrl?: string) => 
      taskManager.createTask('audio', model, prompt, { params, referenceUrl }),
    
    generateMusic: (prompt: string, model: string = 'chirp-v4', params?: any) => 
      taskManager.createTask('audio', model, prompt, { 
        params: { 
          ...params, 
          audioType: 'music',
          sunoModel: model
        } 
      }),
    
    // Task management methods
    cancelTask: taskManager.cancelTask,
    getTaskStatus: taskManager.getTask,
    getAllTasks: () => Object.values(taskManager.tasks),
    getActiveTasks: () => taskManager.activeTasks.map(id => taskManager.getTask(id)!),
    getTaskQueue: () => taskManager.queue,
    
    // Service configuration methods
    configureApiKey: (key: string) => {
      // Placeholder for future needs
      return true;
    },
    
    isApiKeyConfigured: () => {
      // Placeholder for future needs
      return true;
    }
  };
}

// Adaptador para os diferentes serviços de mídia
export const mediaServiceAdapter = {
  // Cria uma tarefa para gerar mídia
  async createTask(
    prompt: string,
    mediaType: string,
    model: string,
    params: any = {},
    referenceUrl?: string
  ): Promise<string> {
    // Implemente a lógica para criar a tarefa com base no tipo de mídia e modelo
    // Isso pode envolver chamar diferentes serviços (PiAPI, APIFrame, etc.)
    // Retorne o ID da tarefa criada
    console.log(`[mediaServiceAdapter] Criando tarefa para ${mediaType} com modelo ${model}`);
    
    // Por enquanto, apenas retorna um ID de tarefa simulado
    return 'task-' + Math.random().toString(36).substring(7);
  },

  // Cancela uma tarefa
  async cancelTask(taskId: string): Promise<boolean> {
    // Implemente a lógica para cancelar a tarefa com base no ID da tarefa
    console.log(`[mediaServiceAdapter] Cancelando tarefa ${taskId}`);
    return true;
  },

  // Verifica o status de uma tarefa
  async checkTaskStatus(taskId: string, service: MediaServiceType = 'piapi'): Promise<MediaTaskStatusResponse> {
    try {
      if (service === 'openai' || service === 'elevenLabs') {
        return { success: true, status: 'completed' }; // Esses serviços não têm status de tarefa
      }
      
      // Serviço PiAPI
      if (service === 'piapi' || service === 'auto') {
        const result = await piapiService.checkTaskStatus(taskId);
        
        return {
          success: true,
          taskId: result.taskId,
          status: mapPiapiStatus(result.status),
          mediaUrl: result.mediaUrl,
          error: result.error,
          percentage: 0
        };
      }
      
      // Serviço APIFrame
      if (service === 'apiframe') {
        const { data, error } = await supabase.functions.invoke('apiframe-task-status', {
          body: { taskId }
        });
        
        if (error) {
          console.error('[mediaServiceAdapter] Erro ao verificar status da tarefa APIFrame:', error);
          throw new Error(error.message);
        }
        
        if (!data) {
          throw new Error('Resposta vazia da API');
        }
        
        // Mapear o status da APIFrame para o formato interno
        return {
          success: true,
          taskId: data.taskId || taskId,
          status: mapApiFrameStatus(data.status),
          mediaUrl: data.mediaUrl,
          error: data.error,
          percentage: data.percentage || 0
        };
      }
      
      // Serviço Suno
      if (service === 'suno') {
        const result = await sunoService.checkTaskStatus(taskId);
        
        return {
          success: true,
          taskId: result.taskId,
          status: mapSunoStatus(result.status),
          mediaUrl: result.songs && result.songs[0]?.audio_url,
          error: result.error,
          percentage: result.percentage || 0
        };
      }
      
      throw new Error(`Serviço de mídia não suportado: ${service}`);
    } catch (err) {
      console.error('[mediaServiceAdapter] Erro ao verificar status da tarefa:', err);
      
      return {
        success: false,
        taskId: taskId,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    }
  },

  // Configura a chave de API
  configureApiKey(apiKey: string): boolean {
    // Implemente a lógica para configurar a chave de API para o serviço apropriado
    console.log(`[mediaServiceAdapter] Configurando chave de API: ${apiKey}`);
    return true;
  },

  // Verifica se a chave de API está configurada
  isApiKeyConfigured(): boolean {
    // Implemente a lógica para verificar se a chave de API está configurada para o serviço apropriado
    console.log('[mediaServiceAdapter] Verificando se a chave de API está configurada');
    return true;
  }
};

// Função auxiliar para mapear status da APIFrame para formato interno
function mapApiFrameStatus(status?: string): MediaTaskStatus {
  if (!status) return 'processing';
  
  switch (status) {
    case 'pending': return 'pending';
    case 'processing': return 'processing';
    case 'finished': return 'completed';
    case 'failed': return 'failed';
    default: return 'processing';
  }
}

// Função auxiliar para mapear status do Suno para formato interno
function mapSunoStatus(status?: string): MediaTaskStatus {
  if (!status) return 'processing';
  
  switch (status) {
    case 'pending': return 'pending';
    case 'processing': return 'processing';
    case 'finished': return 'completed';
    case 'failed': return 'failed';
    default: return 'processing';
  }
}
