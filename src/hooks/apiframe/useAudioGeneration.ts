
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeAudioModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';
import { withRetry, withFallback } from '@/utils/retryOperations';

/**
 * Hook para geração de áudio usando APIframe.ai com mecanismos de resiliência
 */
export function useAudioGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateAudio = useCallback(async (
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
    console.log(`[useAudioGeneration] Gerando áudio com modelo ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    const {
      maxRetries = 2,
      useFallback = true,
      fallbackModel = 'eleven-labs', // Modelo de fallback caso o principal falhe
      referenceUrl
    } = options;
    
    try {
      // Definir a operação principal com retry
      const primaryOperation = () => withRetry(
        async () => {
          // Converter string model para ApiframeAudioModel
          const apiframeModel = getApiframeModelId(model) as ApiframeAudioModel;
          console.log(`[useAudioGeneration] ID do modelo mapeado: ${apiframeModel}`);
          
          // Usar o método generateMedia refatorado
          return await apiframeGeneration.generateMedia(
            prompt, 
            'audio', 
            apiframeModel, 
            params,
            referenceUrl
          );
        },
        {
          maxRetries,
          initialDelay: 1000,
          factor: 1.5,
          maxDelay: 8000,
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
            console.log(`[useAudioGeneration] Tentativa ${attemptNumber} após erro:`, error);
            toast.error(`Falha na geração de áudio. Tentando novamente (${attemptNumber}/${maxRetries})...`, {
              duration: 2500,
              id: `retry-audio-${Date.now()}`
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
          console.warn(`[useAudioGeneration] Modelo ${model} falhou, tentando com ${fallbackModel}...`, error);
          toast.warning(`Modelo ${model} indisponível. Usando ${fallbackModel}...`, {
            duration: 3500
          });
          
          // Converter string model para ApiframeAudioModel (para o modelo de fallback)
          const fallbackApiframeModel = getApiframeModelId(fallbackModel) as ApiframeAudioModel;
          
          // Usar o método generateMedia com o modelo de fallback
          return await apiframeGeneration.generateMedia(
            prompt, 
            'audio', 
            fallbackApiframeModel, 
            params,
            referenceUrl
          );
        }
      );
    } catch (error) {
      console.error('[useAudioGeneration] Erro na geração de áudio após todas as tentativas:', error);
      
      // Garantir erro amigável para o usuário
      const userMessage = error instanceof Error 
        ? error.message.includes('token') 
          ? 'Tokens insuficientes para esta operação.'
          : error.message
        : 'Erro desconhecido na geração de áudio';
      
      toast.error('Falha na geração de áudio', {
        description: userMessage,
        duration: 5000
      });
      
      throw error;
    }
  }, [apiframeGeneration]);

  return {
    generateAudio,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
