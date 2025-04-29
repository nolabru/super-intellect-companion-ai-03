
import { useCallback } from 'react';
import { useApiframeGeneration } from '../useApiframeGeneration';
import { ApiframeParams, ApiframeAudioModel } from '@/types/apiframeGeneration';
import { getApiframeModelId } from '@/utils/modelMapping';
import { toast } from 'sonner';
import { withRetry, withFallback } from '@/utils/retryOperations';

/**
 * Hook para geração de áudio com suporte a streaming usando APIframe.ai
 */
export function useAudioStreamGeneration() {
  const apiframeGeneration = useApiframeGeneration({ showToasts: true });

  const generateAudioStream = useCallback(async (
    prompt: string,
    model: string,
    params: ApiframeParams = {},
    options: {
      maxRetries?: number;
      useFallback?: boolean;
      fallbackModel?: string;
      onStreamUpdate?: (url: string) => void;
    } = {}
  ) => {
    console.log(`[useAudioStreamGeneration] Gerando stream de áudio com modelo ${model}, prompt: "${prompt.substring(0, 50)}..."`);
    
    const {
      maxRetries = 2,
      useFallback = true,
      fallbackModel = 'eleven-labs', // Modelo de fallback caso o principal falhe
      onStreamUpdate
    } = options;
    
    try {
      // Preparar parâmetros para streaming
      const streamParams = {
        ...params,
        stream: true,
        onStreamUpdate: (url: string) => {
          console.log('[useAudioStreamGeneration] Atualização de stream recebida');
          if (onStreamUpdate) {
            onStreamUpdate(url);
          }
        }
      };
      
      // Definir a operação principal com retry
      const primaryOperation = () => withRetry(
        async () => {
          // Converter string model para ApiframeAudioModel
          const apiframeModel = getApiframeModelId(model) as ApiframeAudioModel;
          console.log(`[useAudioStreamGeneration] ID do modelo mapeado: ${apiframeModel}`);
          
          // Usar o método generateMedia refatorado
          return await apiframeGeneration.generateMedia(
            prompt, 
            'audio', 
            apiframeModel, 
            streamParams
          );
        },
        {
          maxRetries,
          initialDelay: 1000,
          factor: 1.5,
          retryCondition: (error) => {
            // Não tentar novamente para erros fatais ou se o streaming não for suportado
            if (
              error.message?.includes('token') || 
              error.message?.includes('API key') || 
              error.message?.includes('Insufficient') ||
              error.message?.includes('Authentication') ||
              error.message?.includes('streaming not supported')
            ) {
              return false;
            }
            return true;
          },
          onRetry: (error, attemptNumber) => {
            console.log(`[useAudioStreamGeneration] Tentativa ${attemptNumber} após erro:`, error);
            toast.error(`Falha no stream de áudio. Tentando novamente (${attemptNumber}/${maxRetries})...`, {
              duration: 2500,
              id: `retry-audio-stream-${Date.now()}`
            });
          }
        }
      );
      
      // Se não usar fallback ou já estiver usando o modelo de fallback, apenas retornar a operação primária
      if (!useFallback || model === fallbackModel) {
        return await primaryOperation();
      }
      
      // Com fallback - usar modelo alternativo se o principal falhar
      return await withFallback(
        primaryOperation,
        async (error) => {
          console.warn(`[useAudioStreamGeneration] Modelo ${model} falhou, tentando com ${fallbackModel}...`, error);
          toast.warning(`Streaming com ${model} indisponível. Usando ${fallbackModel}...`, {
            duration: 3500
          });
          
          // Converter string model para ApiframeAudioModel (para o modelo de fallback)
          const fallbackApiframeModel = getApiframeModelId(fallbackModel) as ApiframeAudioModel;
          
          // Usar o método generateMedia com o modelo de fallback
          return await apiframeGeneration.generateMedia(
            prompt, 
            'audio', 
            fallbackApiframeModel, 
            streamParams
          );
        }
      );
    } catch (error) {
      console.error('[useAudioStreamGeneration] Erro no streaming de áudio após todas as tentativas:', error);
      
      // Verificar se é um erro de suporte a streaming
      if (error instanceof Error && error.message.includes('streaming not supported')) {
        toast.error('Streaming não suportado', {
          description: 'Este modelo não suporta streaming de áudio. Tente usar o método de geração padrão.',
          duration: 5000
        });
      } else {
        // Garantir erro amigável para o usuário
        const userMessage = error instanceof Error 
          ? error.message.includes('token') 
            ? 'Tokens insuficientes para esta operação.'
            : error.message
          : 'Erro desconhecido no streaming de áudio';
        
        toast.error('Falha no streaming de áudio', {
          description: userMessage,
          duration: 5000
        });
      }
      
      throw error;
    }
  }, [apiframeGeneration]);

  return {
    generateAudioStream,
    cancelTask: apiframeGeneration.cancelTask,
    isGenerating: apiframeGeneration.isGenerating,
    configureApiKey: apiframeGeneration.configureApiKey,
    isApiKeyConfigured: apiframeGeneration.isApiKeyConfigured,
    currentTask: apiframeGeneration.currentTask
  };
}
