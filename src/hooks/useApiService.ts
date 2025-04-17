
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';

export interface ApiResponse {
  content: string;
  files?: string[];
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
  modeSwitch?: {
    newMode: string;
    newModel: string;
  };
  error?: string;
}

export function useApiService() {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const sendRequest = useCallback(
    async (
      content: string,
      mode: ChatMode,
      modelId: string,
      files?: string[],
      params?: LumaParams,
      enableStreaming = false,
      streamListener?: (chunk: string) => void,
      conversationHistory?: string,
      userId?: string,
      systemPrompt?: string,
      availableTools?: any[]
    ): Promise<ApiResponse> => {
      try {
        setIsLoading(true);

        // Preparar payload básico
        const payload: any = {
          content,
          mode,
          modelId,
          files,
          params
        };

        // Adicionar campos opcionais se fornecidos
        if (userId) {
          payload.userId = userId;
        }

        if (conversationHistory) {
          payload.conversationHistory = conversationHistory;
        }

        if (systemPrompt) {
          payload.systemPrompt = systemPrompt;
        }

        if (availableTools) {
          payload.tools = availableTools;
        }
        
        // Log payload for debugging
        console.log(`[apiService] Sending request to ai-chat with ${modelId} model in ${mode} mode`, {
          contentPreview: content.substring(0, 50) + '...',
          hasFiles: !!files && files.length > 0,
          hasTools: !!availableTools && availableTools.length > 0,
          payload: JSON.stringify(payload).substring(0, 200) + '...'
        });

        // Se streaming foi solicitado
        if (enableStreaming && streamListener) {
          console.log('[apiService] Streaming mode requested, simulating streaming');
          // No momento, vamos simular streaming com uma única resposta
          // Em uma implementação real, usaríamos fetch com ReadableStream
        }

        // Enviar requisição para a Edge Function usando o cliente Supabase
        // para lidar com autenticação automaticamente
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: payload
        });

        if (error) {
          console.error('[apiService] Error from edge function:', error);
          
          // Mensagem mais amigável
          const errorMessage = typeof error === 'string' 
            ? error 
            : error.message || 'Ocorreu um erro ao se comunicar com o servidor';
          
          toast.error('Erro na requisição', {
            description: errorMessage.substring(0, 200),
            duration: 5000
          });
          
          return {
            content: `Erro: ${errorMessage}`,
            error: errorMessage
          };
        }

        // Se for streaming, garantir que o listener receba o conteúdo final
        if (enableStreaming && streamListener && data.content) {
          streamListener(data.content);
        }

        console.log('[apiService] Response received successfully', {
          hasFiles: data.files && data.files.length > 0,
          tokenInfo: data.tokenInfo ? 'present' : 'absent',
          modeSwitch: data.modeSwitch ? `${data.modeSwitch.newMode}` : 'none'
        });

        return data;
      } catch (err) {
        console.error('[apiService] Error sending request:', err);
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Erro desconhecido ao enviar solicitação';
        
        toast.error('Falha na comunicação', {
          description: errorMessage
        });
        
        return {
          content: `Erro: ${errorMessage}`,
          error: errorMessage
        };
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  return {
    sendRequest,
    isLoading
  };
}
