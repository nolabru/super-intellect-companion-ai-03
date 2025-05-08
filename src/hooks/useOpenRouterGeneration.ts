
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { openRouterService, OpenRouterChatMessage, OpenRouterChatParams } from '@/services/openRouterService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseOpenRouterGenerationOptions {
  onProgress?: (text: string) => void;
  onComplete?: (result: { success: true; text: string }) => void;
  showToasts?: boolean;
}

export function useOpenRouterGeneration(options: UseOpenRouterGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();

  const isApiKeyConfigured = useCallback(() => {
    return openRouterService.isApiKeyConfigured();
  }, []);

  const generateText = useCallback(async (
    messages: OpenRouterChatMessage[],
    model: string,
    params: Omit<OpenRouterChatParams, 'messages' | 'model'> = {}
  ) => {
    try {
      setError(null);
      setGeneratedText(null);
      setIsGenerating(true);
      
      if (!openRouterService.isApiKeyConfigured()) {
        throw new Error('API key não configurada');
      }

      // For streaming responses
      if (params.stream) {
        let fullText = '';
        
        await openRouterService.streamChatCompletion(
          {
            messages,
            model,
            ...params,
            stream: true
          },
          (chunk) => {
            try {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullText += content;
                if (options.onProgress) {
                  options.onProgress(fullText);
                }
              }
            } catch (err) {
              console.error('[useOpenRouterGeneration] Error processing chunk:', err);
            }
          }
        );
        
        setGeneratedText(fullText);
        if (options.onComplete) {
          options.onComplete({ success: true, text: fullText });
        }
        
        return { success: true, text: fullText };
      } 
      // For non-streaming responses
      else {
        const response = await openRouterService.chatCompletion({
          messages,
          model,
          ...params
        });
        
        const generatedContent = response.choices[0]?.message?.content || '';
        setGeneratedText(generatedContent);
        
        if (options.onComplete) {
          options.onComplete({ success: true, text: generatedContent });
        }
        
        return { success: true, text: generatedContent };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[useOpenRouterGeneration] Error generating text:', err);
      
      setError(errorMessage);
      
      if (options.showToasts) {
        toast.error('Erro ao gerar texto', {
          description: errorMessage
        });
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [options]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      
      if (options.showToasts) {
        toast.info('Geração de texto cancelada');
      }
    }
  }, [options.showToasts]);

  const fetchAvailableModels = useCallback(async () => {
    try {
      if (!openRouterService.isApiKeyConfigured()) {
        throw new Error('API key não configurada');
      }
      
      return await openRouterService.listModels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[useOpenRouterGeneration] Error fetching models:', err);
      
      if (options.showToasts) {
        toast.error('Erro ao buscar modelos disponíveis', {
          description: errorMessage
        });
      }
      
      return [];
    }
  }, [options.showToasts]);

  return {
    isGenerating,
    error,
    generatedText,
    generateText,
    cancelGeneration,
    isApiKeyConfigured,
    fetchAvailableModels
  };
}
