
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';

// Inicializar o cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para enviar uma mensagem
  const sendMessage = async (
    content: string,
    mode: ChatMode = 'text',
    modelId: string,
    isComparing = false,
    leftModelId?: string | null,
    rightModelId?: string | null,
    files?: string[],
    params?: LumaParams
  ) => {
    try {
      setLoading(true);
      
      // Adicionar mensagem do usuário primeiro
      const userMessageId = uuidv4();
      const userMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files
      };
      
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Se estiver no modo de comparação, precisamos adicionar uma mensagem de carregamento para cada modelo
      if (isComparing && leftModelId && rightModelId) {
        // Adicionar mensagens de carregamento
        const loadingIdLeft = `loading-${leftModelId}-${uuidv4()}`;
        const loadingIdRight = `loading-${rightModelId}-${uuidv4()}`;
        
        const loadingMessages: MessageType[] = [
          {
            id: loadingIdLeft,
            content: 'Gerando resposta...',
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: leftModelId,
            mode,
            loading: true
          },
          {
            id: loadingIdRight,
            content: 'Gerando resposta...',
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: rightModelId,
            mode,
            loading: true
          }
        ];
        
        setMessages((prevMessages) => [...prevMessages, ...loadingMessages]);
        
        // Enviar para a API para ambos os modelos em paralelo
        const [responseLeft, responseRight] = await Promise.all([
          sendToAI(content, mode, leftModelId, files, params),
          sendToAI(content, mode, rightModelId, files, params)
        ]);
        
        // Remover mensagens de carregamento
        setMessages((prevMessages) => 
          prevMessages.filter(msg => msg.id !== loadingIdLeft && msg.id !== loadingIdRight)
        );
        
        // Adicionar respostas reais
        const newMessages: MessageType[] = [
          {
            id: uuidv4(),
            content: responseLeft.content,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: leftModelId,
            mode,
            files: responseLeft.files
          },
          {
            id: uuidv4(),
            content: responseRight.content,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: rightModelId,
            mode,
            files: responseRight.files
          }
        ];
        
        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      } else {
        // Adicionar mensagem de carregamento
        const loadingId = `loading-${modelId}-${uuidv4()}`;
        
        let loadingMessage = 'Gerando resposta...';
        
        // Mensagens de carregamento específicas para vídeo
        if (mode === 'video') {
          if (modelId === 'luma-video') {
            loadingMessage = 'Conectando ao serviço Luma AI para processamento de vídeo...';
          } else if (modelId === 'kligin-video') {
            loadingMessage = 'Aguardando processamento do serviço Kligin AI...';
          }
        }
        
        const loadingMsg: MessageType = {
          id: loadingId,
          content: loadingMessage,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          loading: true
        };
        
        setMessages((prevMessages) => [...prevMessages, loadingMsg]);
        
        // Enviar para a API
        const response = await sendToAI(content, mode, modelId, files, params);
        
        // Remover mensagem de carregamento
        setMessages((prevMessages) => 
          prevMessages.filter(msg => msg.id !== loadingId)
        );
        
        // Adicionar resposta real
        const newMessage: MessageType = {
          id: uuidv4(),
          content: response.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          files: response.files
        };
        
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
      
      // Remover mensagens de carregamento
      setMessages((prevMessages) => 
        prevMessages.filter(msg => !msg.id?.startsWith('loading-'))
      );
      
      // Adicionar mensagem de erro
      const errorMessage: MessageType = {
        id: uuidv4(),
        content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode,
        error: true
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const sendToAI = async (
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams
  ): Promise<{ content: string, files?: string[] }> => {
    try {
      // Mapear para modelos no backend
      // Este é um exemplo simplificado, pode precisar de mais lógica dependendo da sua API
      
      // Chamar a Edge Function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          content,
          mode,
          modelId,
          files,
          params
        },
      });
      
      if (error) {
        console.error('Erro ao chamar a Edge Function:', error);
        throw new Error(`Erro ao chamar a API: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao enviar para a API:', err);
      throw err;
    }
  };
  
  return {
    messages,
    sendMessage,
    loading,
    error
  };
}
