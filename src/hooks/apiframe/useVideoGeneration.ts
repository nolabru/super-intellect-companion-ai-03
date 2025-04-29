
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeVideoModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';
import { withRetry, withFallback } from '@/utils/retryOperations';

/**
 * Hook para geração de vídeos usando APIframe.ai com mecanismos de resiliência
 */
export function useVideoGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateVideo = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    options: {
      maxRetries?: number;
      useFallback?: boolean;
      fallbackModel?: string;
      referenceUrl?: string;
    } = {}
  ) => {
    console.log(`[useVideoGeneration] Gerando vídeo com modelo ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    const {
      maxRetries = 2,
      useFallback = true,
      fallbackModel = 'runway-gen2', // Modelo de fallback caso o principal falhe
      referenceUrl
    } = options;
    
    try {
      // Definir a operação principal com retry
      const primaryOperation = () => withRetry(
        async () => {
          // Converter string model para ApiframeVideoModel
          const apiframeModel = getApiframeModelId(model) as ApiframeVideoModel;
          console.log(`[useVideoGeneration] ID do modelo mapeado: ${apiframeModel}`);
          
          // Usar o método generateMedia refatorado
          return await apiframeGeneration.generateMedia(
            prompt, 
            'video', 
            apiframeModel, 
            params,
            referenceUrl
          );
        },
        {
          maxRetries,
          initialDelay: 1500, // Delay inicial maior para vídeos
          factor: 2,
          maxDelay: 15000, // Máximo 15 segundos entre tentativas
          retryCondition: (error) => {
            // Não tentar novamente para erros fatais
            if (
              error.message?.includes('token') || 
              error.message?.includes('API key') || 
              error.message?.includes('Insufficient') ||
              error.message?.includes('Authentication')
            ) {
              return false;
            }
            return true;
          },
          onRetry: (error, attemptNumber) => {
            console.log(`[useVideoGeneration] Tentativa ${attemptNumber} após erro:`, error);
            toast.error(`Falha na geração de vídeo. Tentando novamente (${attemptNumber}/${maxRetries})...`, {
              duration: 3000,
              id: `retry-video-${Date.now()}`
            });
          }
        }
      );
      
      // Se não usar fallback, apenas retornar a operação primária
      if (!useFallback || model === fallbackModel) {
        return await primaryOperation();
      }
      
      // Com fallback - usar modelo alternativo se o principal falhar
      return await withFallback(
        primaryOperation,
        async (error) => {
          console.warn(`[useVideoGeneration] Modelo ${model} falhou, tentando com ${fallbackModel}...`, error);
          toast.warning(`Modelo ${model} indisponível. Usando ${fallbackModel}...`, {
            duration: 4000
          });
          
          // Converter string model para ApiframeVideoModel (para o modelo de fallback)
          const fallbackApiframeModel = getApiframeModelId(fallbackModel) as ApiframeVideoModel;
          
          // Usar o método generateMedia com o modelo de fallback
          return await apiframeGeneration.generateMedia(
            prompt, 
            'video', 
            fallbackApiframeModel, 
            params,
            referenceUrl
          );
        }
      );
    } catch (error) {
      console.error('[useVideoGeneration] Erro na geração de vídeo após todas as tentativas:', error);
      
      // Garantir erro amigável para o usuário
      const userMessage = error instanceof Error 
        ? error.message.includes('token') 
          ? 'Tokens insuficientes para esta operação.'
          : error.message
        : 'Erro desconhecido na geração de vídeo';
      
      toast.error('Falha na geração de vídeo', {
        description: userMessage,
        duration: 5000
      });
      
      throw error;
    }
  }, [apiframeGeneration]);

  return {
    generateVideo,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
