
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatServiceOptions {
  showToasts?: boolean;
}

/**
 * Hook para adaptar serviços de chat
 */
export function useChatServiceAdapter(options: ChatServiceOptions = {}) {
  const { showToasts = true } = options;

  /**
   * Envia uma mensagem para o modelo de chat
   */
  const sendMessage = async (
    content: string,
    modelId: string,
    mode: string,
    files: string[] = [],
    params: any = {},
    abortSignal?: AbortSignal,
    onStreamUpdate?: (chunk: string) => void
  ) => {
    try {
      if (!content && files.length === 0) {
        throw new Error('É necessário fornecer conteúdo ou arquivos para enviar uma mensagem');
      }

      const enableStreaming = !!onStreamUpdate;
      
      // Preparar payload para a requisição
      const requestBody = {
        prompt: content,
        model: modelId,
        mode,
        images: files,
        params
      };

      if (showToasts) {
        toast.info('Enviando mensagem...', {
          id: 'sending-message',
          duration: 2000
        });
      }

      // Chamar a Edge Function para obter resposta
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: requestBody,
        signal: abortSignal
      });

      if (error) {
        if (error.message?.includes('aborted')) {
          throw new Error('A requisição foi cancelada');
        }
        
        console.error('[chatServiceAdapter] Erro na resposta da Edge Function:', error);
        throw new Error(`Erro ao chamar a API: ${error.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da API');
      }

      // Se temos streaming habilitado e um callback, simular streaming
      if (enableStreaming && onStreamUpdate && data.content) {
        // Dividir a mensagem em chunks para simular o streaming
        const content = data.content;
        const words = content.split(' ');
        
        // Número de palavras por chunk
        const wordsPerChunk = 3;
        
        let accumulatedContent = '';
        
        // Processar em chunks
        for (let i = 0; i < words.length; i += wordsPerChunk) {
          if (abortSignal?.aborted) {
            throw new Error('A requisição foi cancelada');
          }
          
          const chunk = words.slice(i, i + wordsPerChunk).join(' ') + (i + wordsPerChunk < words.length ? ' ' : '');
          accumulatedContent += chunk;
          
          // Enviar chunk para o listener
          onStreamUpdate(accumulatedContent);
          
          // Adicionar pequeno delay para simular streaming natural
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return data;
    } catch (err) {
      if (abortSignal?.aborted) {
        throw new Error('A requisição foi cancelada');
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[chatServiceAdapter] Erro ao enviar mensagem:', err);
      
      if (showToasts) {
        toast.error(`Erro ao enviar mensagem: ${errorMessage}`, {
          duration: 5000
        });
      }
      
      throw err;
    }
  };

  return {
    sendMessage
  };
}
