
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeImageModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';
import { withRetry, withFallback } from '@/utils/retryOperations';

/**
 * Hook para geração de imagens usando APIframe.ai com mecanismos de resiliência
 */
export function useImageGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateImage = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    options: {
      maxRetries?: number;
      useFallback?: boolean;
      fallbackModel?: string;
    } = {}
  ) => {
    console.log(`[useImageGeneration] Gerando imagem com modelo ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    const {
      maxRetries = 2,
      useFallback = true,
      fallbackModel = 'stability-sd-xl' // Modelo de fallback caso o principal falhe
    } = options;
    
    try {
      // Definir a operação principal com retry
      const primaryOperation = () => withRetry(
        async () => {
          // Converter string model para ApiframeImageModel
          const apiframeModel = getApiframeModelId(model) as ApiframeImageModel;
          console.log(`[useImageGeneration] ID do modelo mapeado: ${apiframeModel}`);
          
          // Usar o método generateMedia refatorado
          return await apiframeGeneration.generateMedia(
            prompt, 
            'image', 
            apiframeModel, 
            params
          );
        },
        {
          maxRetries,
          initialDelay: 1000,
          factor: 2,
          retryCondition: (error) => {
            // Não tentar novamente para erros fatais como tokens insuficientes ou API key inválida
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
            console.log(`[useImageGeneration] Tentativa ${attemptNumber} após erro:`, error);
            toast.error(`Falha na geração. Tentando novamente (${attemptNumber}/${maxRetries})...`, {
              duration: 2000,
              id: `retry-image-${Date.now()}`
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
          console.warn(`[useImageGeneration] Modelo ${model} falhou, tentando com ${fallbackModel}...`, error);
          toast.warning(`Modelo ${model} indisponível. Usando ${fallbackModel}...`, {
            duration: 3000
          });
          
          // Converter string model para ApiframeImageModel (para o modelo de fallback)
          const fallbackApiframeModel = getApiframeModelId(fallbackModel) as ApiframeImageModel;
          
          // Usar o método generateMedia com o modelo de fallback
          return await apiframeGeneration.generateMedia(
            prompt, 
            'image', 
            fallbackApiframeModel, 
            params
          );
        }
      );
    } catch (error) {
      console.error('[useImageGeneration] Erro na geração de imagem após todas as tentativas:', error);
      
      // Garantir erro amigável para o usuário
      const userMessage = error instanceof Error 
        ? error.message.includes('token') 
          ? 'Tokens insuficientes para esta operação.'
          : error.message
        : 'Erro desconhecido na geração de imagem';
      
      toast.error('Falha na geração de imagem', {
        description: userMessage,
        duration: 5000
      });
      
      throw error;
    }
  }, [apiframeGeneration]);

  return {
    generateImage,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
