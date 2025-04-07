
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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

  // Carregar conversas do usuário
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [user]);

  // Carregar mensagens da conversa atual
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
      
      // Se houver conversas, selecione a mais recente
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
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender === 'user' ? 'user' : 'ai' as 'user' | 'ai',
          model: msg.model || '',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          }),
          mode: msg.mode as ChatMode
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

  const sendMessage = async (
    content: string, 
    mode: ChatMode, 
    model: string, 
    isComparing: boolean = false,
    leftModel: string = '',
    rightModel: string = ''
  ) => {
    let conversationId = currentConversationId;
    
    // Se não houver uma conversa ativa, criar uma nova
    if (!conversationId && user) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }
    
    // Se o usuário não estiver logado, apenas simular respostas sem salvar
    if (!user || !conversationId) {
      const newUserMessage: MessageType = {
        id: uuidv4(),
        content,
        sender: 'user',
        model: 'user',
        timestamp: formatTime(),
        mode
      };

      let newMessages = [...messages, newUserMessage];

      if (isComparing) {
        // Simular respostas dos dois modelos
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
        // Modo único
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
      return;
    }

    // Usuário está logado e temos uma conversa ativa
    try {
      // Adicionar mensagem do usuário imediatamente na UI
      const userMessageId = uuidv4();
      const newUserMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        model: 'user',
        timestamp: formatTime(),
        mode
      };
      
      setMessages(prev => [...prev, newUserMessage]);

      // Chamar a Edge Function para obter respostas
      if (isComparing) {
        // Chamar para o modelo da esquerda
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
            conversationId
          })
        }).then(res => res.json());

        // Chamar para o modelo da direita
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
            conversationId
          })
        }).then(res => res.json());

        // Resolver as duas promessas
        const [leftResult, rightResult] = await Promise.all([leftResponsePromise, rightResponsePromise]);

        // Atualizar a UI com as respostas
        const leftResponseId = uuidv4();
        const rightResponseId = uuidv4();

        const leftResponse: MessageType = {
          id: leftResponseId,
          content: leftResult.content,
          sender: 'ai',
          model: leftModel,
          timestamp: formatTime(),
          mode
        };

        const rightResponse: MessageType = {
          id: rightResponseId,
          content: rightResult.content,
          sender: 'ai',
          model: rightModel,
          timestamp: formatTime(),
          mode
        };

        setMessages(prev => [...prev, leftResponse, rightResponse]);
      } else {
        // Modo único
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
            conversationId
          })
        }).then(res => res.json());

        const aiResponseId = uuidv4();
        const aiResponse: MessageType = {
          id: aiResponseId,
          content: response.content,
          sender: 'ai',
          model,
          timestamp: formatTime(),
          mode
        };

        setMessages(prev => [...prev, aiResponse]);
      }

      // Recarregar as mensagens do banco de dados para sincronizar
      await loadMessages(conversationId);
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    sendMessage,
    loading
  };
};
