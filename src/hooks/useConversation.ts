
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { supabase } from '@/integrations/supabase/client';
import { useApiService } from './useApiService';
import { useMediaGallery } from './useMediaGallery';
import { toast } from 'sonner';

// Interface definition for conversation type
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
  const apiService = useApiService();
  const { saveMediaToGallery } = useMediaGallery();

  // Carregar conversas do usuário ao inicializar
  useEffect(() => {
    const loadUserConversations = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user || !user.user) {
          return; // Usuário não autenticado
        }
        
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.user.id)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setConversations(data);
          // Se não houver conversa atual e houver conversas disponíveis, selecione a mais recente
          if (!currentConversationId && data.length > 0) {
            setCurrentConversationId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar conversas');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserConversations();
  }, []);
  
  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (!currentConversationId) {
        setMessages([]);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Carregando mensagens para a conversa ${currentConversationId}`);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          console.log(`Encontradas ${data.length} mensagens para a conversa ${currentConversationId}`, data);
          
          // Converte os dados do banco para o formato MessageType
          const formattedMessages: MessageType[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender as 'user' | 'assistant',
            timestamp: msg.timestamp,
            model: msg.model,
            mode: msg.mode as ChatMode,
            files: msg.files || [],
            mediaUrl: msg.media_url || undefined
          }));
          
          setMessages(formattedMessages);
        } else {
          console.log('Nenhuma mensagem encontrada para esta conversa');
          setMessages([]);
        }
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
        toast.error('Erro ao carregar mensagens da conversa');
      } finally {
        setLoading(false);
      }
    };
    
    loadConversationMessages();
  }, [currentConversationId]);

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
        setConversations(prev => [data[0], ...prev]);
        setMessages([]); // Limpar mensagens ao criar nova conversa
        toast.success('Nova conversa criada');
      }
    } catch (err) {
      console.error('Erro ao criar conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa');
      toast.error('Erro ao criar nova conversa');
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir uma conversa
  const deleteConversation = async (id: string) => {
    try {
      setLoading(true);
      // Primeiro excluir todas as mensagens associadas
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .match({ conversation_id: id });
        
      if (messagesError) throw messagesError;
      
      // Depois excluir a conversa
      const { error } = await supabase
        .from('conversations')
        .delete()
        .match({ id });

      if (error) throw error;
      
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      if (currentConversationId === id) {
        // Se a conversa atual foi excluída, selecione a próxima disponível ou limpe
        const remainingConversations = conversations.filter(conv => conv.id !== id);
        if (remainingConversations.length > 0) {
          setCurrentConversationId(remainingConversations[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
      
      toast.success('Conversa excluída com sucesso');
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
      toast.error('Erro ao excluir conversa');
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
      
      toast.success('Conversa renomeada com sucesso');
    } catch (err) {
      console.error('Erro ao renomear conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
      toast.error('Erro ao renomear conversa');
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar mensagem no banco de dados
  const saveMessageToDatabase = async (message: MessageType, conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          id: message.id,
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp,
          conversation_id: conversationId,
          model: message.model,
          mode: message.mode,
          files: message.files || null,
          media_url: message.mediaUrl || null
        }]);
        
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err);
      // Não interromper o fluxo se falhar ao salvar
    }
  };

  // Atualizar o título da conversa com base na primeira mensagem do usuário
  const updateConversationTitle = async (conversationId: string, content: string) => {
    try {
      // Verificar se o título atual é "Nova Conversa"
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation || conversation.title !== 'Nova Conversa') {
        return; // Não atualizar se não for o título padrão
      }
      
      // Usar os primeiros 30 caracteres como título ou todo o conteúdo se for menor
      const newTitle = content.length > 30 
        ? content.substring(0, 30) + '...' 
        : content;
      
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .match({ id: conversationId });

      if (error) throw error;
      
      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => conv.id === conversationId ? { ...conv, title: newTitle } : conv)
      );
    } catch (err) {
      console.error('Erro ao atualizar título da conversa:', err);
      // Não interromper o fluxo se falhar
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
      
      // Se não houver conversa atual, criar uma nova
      if (!currentConversationId) {
        await createNewConversation();
        // Se ainda não há ID após tentar criar, algo deu errado
        if (!currentConversationId) {
          throw new Error("Não foi possível criar uma nova conversa");
        }
      }
      
      const conversationId = currentConversationId!;
      
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
      
      // Salvar mensagem do usuário no banco
      await saveMessageToDatabase(userMessage, conversationId);
      
      // Atualizar título da conversa se for a primeira mensagem
      if (messages.length === 0) {
        await updateConversationTitle(conversationId, content);
      }
      
      // Se estiver no modo de comparação, precisamos adicionar uma mensagem para cada modelo
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
          apiService.sendRequest(content, mode, leftModelId, files, params),
          apiService.sendRequest(content, mode, rightModelId, files, params)
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
        
        // Salvar mensagens no banco
        await Promise.all(newMessages.map(msg => saveMessageToDatabase(msg, conversationId)));
        
        // Salvar mídias na galeria se existirem
        if (mode !== 'text') {
          // Para o modelo da esquerda
          if (responseLeft.files && responseLeft.files.length > 0) {
            await saveMediaToGallery(
              responseLeft.files[0],
              content,
              mode,
              leftModelId,
              params
            );
          }
          
          // Para o modelo da direita
          if (responseRight.files && responseRight.files.length > 0) {
            await saveMediaToGallery(
              responseRight.files[0],
              content,
              mode,
              rightModelId,
              params
            );
          }
        }
      } else {
        // Mensagem única - adicionar mensagem de carregamento
        const loadingId = `loading-${modelId}-${uuidv4()}`;
        
        let loadingMessage = 'Gerando resposta...';
        
        // Mensagens de carregamento específicas para cada modo
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
          
          const responsePromise = apiService.sendRequest(content, mode, modelId, files, params);
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
          
          // Salvar mensagem no banco
          await saveMessageToDatabase(newMessage, conversationId);
          
          // Salvar mídia na galeria se existir
          if (mode !== 'text' && response.files && response.files.length > 0) {
            await saveMediaToGallery(
              response.files[0],
              content,
              mode,
              modelId,
              params
            );
          }
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
          
          // Salvar mensagem de erro no banco
          await saveMessageToDatabase(errorMessage, conversationId);
          
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
        
        // Salvar mensagem de erro no banco se houver ID de conversa
        if (currentConversationId) {
          await saveMessageToDatabase(errorMessage, currentConversationId);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Limpar mensagens ao trocar de conversa
  const clearMessages = () => {
    setMessages([]);
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
    renameConversation,
    clearMessages
  };
}
