
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { useApiService } from './useApiService';
import { useMediaGallery } from './useMediaGallery';
import { toast } from 'sonner';
import { ConversationType } from '@/types/conversation';
import { 
  loadUserConversations, 
  loadConversationMessages, 
  createConversation, 
  deleteConversation as deleteConversationUtil, 
  renameConversation as renameConversationUtil,
  saveMessageToDatabase,
  updateConversationTitle
} from '@/utils/conversationUtils';
import { createMessageService } from '@/services/messageService';

export { ConversationType };

export function useConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const apiService = useApiService();
  const { saveMediaToGallery } = useMediaGallery();
  
  // Create message service
  const messageService = createMessageService(
    apiService,
    { saveMediaToGallery },
    setMessages,
    setError
  );

  // Load user conversations on init
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await loadUserConversations();
        
        if (fetchError) {
          setError(fetchError);
          return;
        }
        
        if (data) {
          setConversations(data);
          // Select most recent conversation if none is selected and there are conversations available
          if (!currentConversationId && data.length > 0) {
            setCurrentConversationId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar conversas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar conversas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Load conversation messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversationId) {
        setMessages([]);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error: fetchError } = await loadConversationMessages(currentConversationId);
        
        if (fetchError) {
          setError(fetchError);
          toast.error('Erro ao carregar mensagens da conversa');
          return;
        }
        
        if (data) {
          // Convert database data to MessageType format
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
          setMessages([]);
        }
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar mensagens');
        toast.error('Erro ao carregar mensagens da conversa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentConversationId]);

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      setLoading(true);
      
      // Clear messages before creating a new conversation
      setMessages([]);
      
      const { data, error: createError } = await createConversation();
      
      if (createError) {
        setError(createError);
        return;
      }
      
      if (data) {
        setCurrentConversationId(data.id);
        setConversations(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error('Erro ao criar nova conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar nova conversa');
    } finally {
      setLoading(false);
    }
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    try {
      setLoading(true);
      
      const { success, error: deleteError } = await deleteConversationUtil(id);
      
      if (deleteError) {
        setError(deleteError);
        return;
      }
      
      if (success) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        
        if (currentConversationId === id) {
          // If current conversation was deleted, select the next available one or clear
          const remainingConversations = conversations.filter(conv => conv.id !== id);
          if (remainingConversations.length > 0) {
            setCurrentConversationId(remainingConversations[0].id);
          } else {
            setCurrentConversationId(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
    } finally {
      setLoading(false);
    }
  };

  // Rename a conversation
  const renameConversation = async (id: string, newTitle: string) => {
    try {
      setLoading(true);
      
      const { success, error: renameError } = await renameConversationUtil(id, newTitle);
      
      if (renameError) {
        setError(renameError);
        return;
      }
      
      if (success) {
        setConversations(prev => 
          prev.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv)
        );
      }
    } catch (err) {
      console.error('Erro ao renomear conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
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
      
      // Create new conversation if none is selected
      if (!currentConversationId) {
        await createNewConversation();
        // If still no conversation ID, something went wrong
        if (!currentConversationId) {
          throw new Error("Não foi possível criar uma nova conversa");
        }
      }
      
      const conversationId = currentConversationId!;
      
      // Add user message first
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
      
      // Save user message to database
      await saveMessageToDatabase(userMessage, conversationId);
      
      // Update conversation title if this is the first message
      if (messages.length === 0) {
        const { success, newTitle } = await updateConversationTitle(conversationId, content, conversations);
        if (success && newTitle) {
          setConversations(prev => 
            prev.map(conv => conv.id === conversationId ? { ...conv, title: newTitle } : conv)
          );
        }
      }
      
      // Handle based on whether comparing models or not
      if (isComparing && leftModelId && rightModelId) {
        await messageService.handleCompareModels(
          content, 
          mode, 
          leftModelId, 
          rightModelId, 
          conversationId, 
          files, 
          params
        );
      } else {
        await messageService.handleSingleModelMessage(
          content, 
          mode, 
          modelId, 
          conversationId, 
          messages,
          conversations,
          files, 
          params
        );
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
      
      // Add a general error message if we haven't already added one
      if (!messages.some(msg => msg.error && msg.timestamp > new Date(Date.now() - 5000).toISOString())) {
        // Remove any loading messages
        setMessages((prevMessages) => 
          prevMessages.filter(msg => !msg.id?.startsWith('loading-'))
        );
        
        // Add error message
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
        
        // Save error message if there's a conversation ID
        if (currentConversationId) {
          await saveMessageToDatabase(errorMessage, currentConversationId);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear messages when switching conversations
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
