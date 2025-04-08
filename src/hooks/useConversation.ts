
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// Interface para os dados recebidos da API
interface MessageData {
  id: string;
  content: string;
  conversation_id: string;
  sender: string;
  model: string | null;
  timestamp: string;
  mode: string;
  media_url?: string | null;
  audio_data?: string | null;
}

export const useConversation = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const formatTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setConversations(data || []);
      
      if (data && data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      if (data) {
        const formattedMessages = (data as MessageData[]).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender === 'user' ? 'user' : 'ai' as 'user' | 'ai',
          model: msg.model || '',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          }),
          mode: msg.mode as ChatMode,
          mediaUrl: msg.media_url || undefined,
          audioData: msg.audio_data || undefined
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (title: string = "Nova conversa") => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ title, user_id: user.id }])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        await loadConversations();
        setCurrentConversationId(data[0].id);
        return data[0].id;
      }
      
      return null;
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar uma nova conversa",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;
    
    try {
      // Deletar todas as mensagens da conversa
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
        
      if (messagesError) throw messagesError;
      
      // Deletar a conversa
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
        
      if (error) throw error;
      
      // Atualizar a lista de conversas
      await loadConversations();
      
      // Se a conversa deletada era a atual, selecionar outra conversa
      if (currentConversationId === conversationId) {
        if (conversations.length > 1) {
          const newCurrentConversation = conversations.find(c => c.id !== conversationId);
          if (newCurrentConversation) {
            setCurrentConversationId(newCurrentConversation.id);
          } else {
            setCurrentConversationId(null);
          }
        } else {
          setCurrentConversationId(null);
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Conversa excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa",
        variant: "destructive",
      });
    }
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);
        
      if (error) throw error;
      
      // Atualizar lista de conversas
      await loadConversations();
      
      toast({
        title: "Sucesso",
        description: "Conversa renomeada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao renomear conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear a conversa",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (
    content: string, 
    mode: ChatMode, 
    model: string, 
    isComparing: boolean = false,
    leftModel: string = '',
    rightModel: string = '',
    files?: string[]
  ) => {
    // Adicione estado de carregamento
    setLoading(true);
    
    let conversationId = currentConversationId;
    
    if (!conversationId && user) {
      conversationId = await createNewConversation();
      if (!conversationId) {
        setLoading(false);
        return;
      }
    }
    
    // Modo demonstração (sem autenticação)
    if (!user || !conversationId) {
      const newUserMessage: MessageType = {
        id: uuidv4(),
        content,
        sender: 'user',
        model: 'user',
        timestamp: formatTime(),
        mode,
        mediaUrl: files && files.length > 0 ? files[0] : undefined
      };

      let newMessages = [...messages, newUserMessage];

      if (isComparing) {
        const leftResponse: MessageType = {
          id: uuidv4(),
          content: `Resposta do ${leftModel} para: "${content}"`,
          sender: 'ai',
          model: leftModel,
          timestamp: formatTime(),
          mode
        };

        const rightResponse: MessageType = {
          id: uuidv4(),
          content: `Resposta do ${rightModel} para: "${content}"`,
          sender: 'ai',
          model: rightModel,
          timestamp: formatTime(),
          mode
        };

        newMessages = [...newMessages, leftResponse, rightResponse];
      } else {
        const response: MessageType = {
          id: uuidv4(),
          content: `Resposta do ${model} para: "${content}"`,
          sender: 'ai',
          model,
          timestamp: formatTime(),
          mode
        };

        newMessages = [...newMessages, response];
      }

      setMessages(newMessages);
      setLoading(false);
      return;
    }

    try {
      // Adicionar mensagem do usuário imediatamente na UI
      const userMessageId = uuidv4();
      const newUserMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        model: 'user',
        timestamp: formatTime(),
        mode,
        mediaUrl: files && files.length > 0 ? files[0] : undefined
      };
      
      // Adiciona a mensagem do usuário ao estado local antes da resposta da API
      setMessages(prev => [...prev, newUserMessage]);
      
      // Indicador visual temporário "Gerando..." para cada modelo
      let loadingIds: string[] = [];
      
      if (isComparing) {
        const loadingLeftId = `loading-left-${userMessageId}`;
        const loadingRightId = `loading-right-${userMessageId}`;
        
        loadingIds = [loadingLeftId, loadingRightId];
        
        const loadingLeftResponse: MessageType = {
          id: loadingLeftId,
          content: "Gerando resposta...",
          sender: 'ai',
          model: leftModel,
          timestamp: formatTime(),
          mode
        };
        
        const loadingRightResponse: MessageType = {
          id: loadingRightId,
          content: "Gerando resposta...",
          sender: 'ai',
          model: rightModel,
          timestamp: formatTime(),
          mode
        };
        
        setMessages(prev => [...prev, loadingLeftResponse, loadingRightResponse]);
      } else {
        const loadingId = `loading-${userMessageId}`;
        loadingIds = [loadingId];
        
        const loadingResponse: MessageType = {
          id: loadingId,
          content: "Gerando resposta...",
          sender: 'ai',
          model,
          timestamp: formatTime(),
          mode
        };
        
        setMessages(prev => [...prev, loadingResponse]);
      }

      if (isComparing) {
        try {
          const leftResponsePromise = fetch('https://vygluorjwehcdigzxbaa.supabase.co/functions/v1/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              prompt: content,
              model: leftModel,
              mode,
              conversationId,
              files
            })
          }).then(res => res.json());

          const rightResponsePromise = fetch('https://vygluorjwehcdigzxbaa.supabase.co/functions/v1/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              prompt: content,
              model: rightModel,
              mode,
              conversationId,
              files
            })
          }).then(res => res.json());

          const [leftResult, rightResult] = await Promise.all([leftResponsePromise, rightResponsePromise]);

          // Remover mensagens de carregamento temporárias
          setMessages(prev => prev.filter(msg => 
            msg.id !== `loading-left-${userMessageId}` && 
            msg.id !== `loading-right-${userMessageId}`
          ));

          const leftResponseId = uuidv4();
          const rightResponseId = uuidv4();

          const leftResponse: MessageType = {
            id: leftResponseId,
            content: leftResult.content || "Erro ao processar resposta",
            sender: 'ai',
            model: leftModel,
            timestamp: formatTime(),
            mode,
            mediaUrl: leftResult.mediaUrl,
            audioData: leftResult.audioData
          };

          const rightResponse: MessageType = {
            id: rightResponseId,
            content: rightResult.content || "Erro ao processar resposta",
            sender: 'ai',
            model: rightModel,
            timestamp: formatTime(),
            mode,
            mediaUrl: rightResult.mediaUrl,
            audioData: rightResult.audioData
          };

          setMessages(prev => {
            // Filtrar mensagens temporárias de "carregando"
            const filteredMessages = prev.filter(m => 
              m.id !== `loading-left-${userMessageId}` && 
              m.id !== `loading-right-${userMessageId}`
            );
            
            // Adicionar novas respostas
            return [...filteredMessages, leftResponse, rightResponse];
          });
        } catch (error: any) {
          console.error("Erro na chamada da API:", error);
          
          // Remover mensagens de carregamento e mostrar erro
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => 
              msg.id !== `loading-left-${userMessageId}` && 
              msg.id !== `loading-right-${userMessageId}`
            );
            
            // Adicionar mensagens de erro
            const leftErrorMessage: MessageType = {
              id: uuidv4(),
              content: "Erro ao obter resposta do modelo. Por favor, tente novamente.",
              sender: 'ai',
              model: leftModel,
              timestamp: formatTime(),
              mode
            };
            
            const rightErrorMessage: MessageType = {
              id: uuidv4(),
              content: "Erro ao obter resposta do modelo. Por favor, tente novamente.",
              sender: 'ai',
              model: rightModel,
              timestamp: formatTime(),
              mode
            };
            
            return [...filteredMessages, leftErrorMessage, rightErrorMessage];
          });
          
          toast({
            title: "Erro",
            description: "Falha ao se comunicar com o modelo AI",
            variant: "destructive",
          });
        }
      } else {
        try {
          console.log("Enviando requisição para a API com:", {
            prompt: content,
            model,
            mode,
            conversationId,
            files
          });
          
          const response = await fetch('https://vygluorjwehcdigzxbaa.supabase.co/functions/v1/ai-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              prompt: content,
              model,
              mode,
              conversationId,
              files
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          
          const result = await response.json();
          console.log("Resposta recebida da API:", result);

          // Remover mensagem de carregamento temporária
          const loadingId = `loading-${userMessageId}`;
          
          setMessages(prev => {
            // Filtrar mensagem temporária de "carregando"
            const filteredMessages = prev.filter(msg => msg.id !== loadingId);
            
            // Criar a mensagem de resposta
            const aiResponse: MessageType = {
              id: uuidv4(),
              content: result.content || "Erro ao processar resposta",
              sender: 'ai',
              model,
              timestamp: formatTime(),
              mode,
              mediaUrl: result.mediaUrl,
              audioData: result.audioData
            };
            
            // Adicionar a nova resposta
            return [...filteredMessages, aiResponse];
          });
        } catch (error: any) {
          console.error("Erro na chamada da API:", error);
          
          // Remover mensagem de carregamento e mostrar erro
          const loadingId = `loading-${userMessageId}`;
          
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => msg.id !== loadingId);
            const errorMessage: MessageType = {
              id: uuidv4(),
              content: "Erro ao obter resposta do modelo. Por favor, tente novamente.",
              sender: 'ai',
              model,
              timestamp: formatTime(),
              mode
            };
            return [...filteredMessages, errorMessage];
          });
          
          toast({
            title: "Erro",
            description: "Falha ao se comunicar com o modelo AI: " + error.message,
            variant: "destructive",
          });
        }
      }

      // Não recarregar as mensagens do banco de dados para evitar problemas com o estado
      // await loadMessages(conversationId);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    loading
  };
};
