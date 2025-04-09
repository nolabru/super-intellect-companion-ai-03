
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { createClient } from '@supabase/supabase-js';

// Corrigindo o cliente Supabase com URL e chave anônima
const supabaseUrl = 'https://vygluorjwehcdigzxbaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z2x1b3Jqd2VoY2RpZ3p4YmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI2NjcsImV4cCI6MjA1OTYxODY2N30.uuV_JYIUKuv1rV3-MicDiTT28azOWdhJoVjpHMfzVGg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ConversationType {
  id: string;
  title: string;
  updated_at: string;
  user_id: string;
}

export function useConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Função para criar uma nova conversa
  const createNewConversation = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        throw new Error("User is not authenticated");
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          { title: 'Nova Conversa', user_id: user.data.user.id }
        ])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentConversationId(data[0].id);
        setConversations(prev => [...prev, data[0]]);
      }
    } catch (err) {
      console.error('Erro ao criar conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa');
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir uma conversa
  const deleteConversation = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('conversations')
        .delete()
        .match({ id });

      if (error) throw error;
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
    } finally {
      setLoading(false);
    }
  };

  // Função para renomear uma conversa
  const renameConversation = async (id: string, newTitle: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .match({ id });

      if (error) throw error;
      setConversations(prev => 
        prev.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv)
      );
    } catch (err) {
      console.error('Erro ao renomear conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
    } finally {
      setLoading(false);
    }
  };

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
            files: responseLeft.files,
            mediaUrl: responseLeft.files && responseLeft.files.length > 0 ? responseLeft.files[0] : undefined
          },
          {
            id: uuidv4(),
            content: responseRight.content,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: rightModelId,
            mode,
            files: responseRight.files,
            mediaUrl: responseRight.files && responseRight.files.length > 0 ? responseRight.files[0] : undefined
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
        } else if (mode === 'image') {
          if (modelId === 'luma-image') {
            loadingMessage = 'Conectando ao serviço Luma AI para geração de imagem...';
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
        
        try {
          // Enviar para a API com timeout de 3 minutos
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Tempo limite excedido na solicitação")), 180000);
          });
          
          const responsePromise = sendToAI(content, mode, modelId, files, params);
          const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
          
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
            files: response.files,
            mediaUrl: response.files && response.files.length > 0 ? response.files[0] : undefined
          };
          
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        } catch (err) {
          console.error("Erro durante solicitação:", err);
          
          // Remover mensagem de carregamento
          setMessages((prevMessages) => 
            prevMessages.filter(msg => msg.id !== loadingId)
          );
          
          // Adicionar mensagem de erro específica baseada no modo e erro
          const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
          let friendlyError = `Ocorreu um erro ao processar sua solicitação. ${errorMsg}`;
          
          if (mode === 'video' && modelId.includes('luma')) {
            friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API da Luma está configurada corretamente.`;
          } else if (mode === 'image' && modelId.includes('luma')) {
            friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API da Luma está configurada corretamente.`;
          }
          
          const errorMessage: MessageType = {
            id: uuidv4(),
            content: friendlyError,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            error: true
          };
          
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
          throw err; // Re-throw para ser capturado pelo catch externo
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
      
      // Se ainda não adicionamos uma mensagem de erro (no bloco try interno), adicionamos aqui
      if (!messages.some(msg => msg.error && msg.timestamp > new Date(Date.now() - 5000).toISOString())) {
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
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Função melhorada para enviar solicitações à API com retry e melhor tratamento de erros
  const sendToAI = async (
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams
  ): Promise<{ content: string, files?: string[] }> => {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Registrar tentativas de retry
        if (attempt > 0) {
          console.log(`Tentativa ${attempt}/${maxRetries} de chamar a Edge Function...`);
        }
        
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
        console.error(`Erro ao enviar para a API (tentativa ${attempt + 1}/${maxRetries + 1}):`, err);
        lastError = err;
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    throw lastError || new Error("Falha após tentativas máximas");
  };
  
  return {
    messages,
    sendMessage,
    loading,
    error,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    deleteConversation,
    renameConversation
  };
}
