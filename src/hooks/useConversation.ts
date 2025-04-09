
import { useState, useEffect, useCallback } from 'react';
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

// Use export type for re-exporting types when isolatedModules is enabled
export type { ConversationType };

export function useConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const apiService = useApiService();
  const { saveMediaToGallery, saving } = useMediaGallery();
  
  // Create message service with complete mediaGallery object including the 'saving' property
  const messageService = createMessageService(
    apiService,
    { saveMediaToGallery, saving },
    setMessages,
    setError
  );

  // Clear messages - explicit function to ensure messages are cleared
  const clearMessages = useCallback(() => {
    console.log('Clearing all messages');
    setMessages([]);
  }, []);

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
            console.log(`Auto-selecting the most recent conversation: ${data[0].id}`);
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
        console.log('No conversation selected, clearing messages');
        clearMessages();
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Loading messages for conversation: ${currentConversationId}`);
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
          
          console.log(`Setting ${formattedMessages.length} messages from conversation ${currentConversationId}`);
          setMessages(formattedMessages);
        } else {
          console.log('No messages found, clearing message state');
          clearMessages();
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
  }, [currentConversationId, clearMessages]);

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      setLoading(true);
      
      // Clear messages before creating a new conversation
      console.log('Creating new conversation, clearing messages first');
      clearMessages();
      
      const { data, error: createError, success } = await createConversation();
      
      if (createError) {
        setError(createError);
        return;
      }
      
      if (data && success) {
        console.log(`New conversation created with ID: ${data.id}`);
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
        console.log(`Conversation ${id} deleted successfully`);
        setConversations(prev => prev.filter(conv => conv.id !== id));
        
        if (currentConversationId === id) {
          console.log('Current conversation was deleted, selecting next available one');
          // If current conversation was deleted, select the next available one or clear
          const remainingConversations = conversations.filter(conv => conv.id !== id);
          if (remainingConversations.length > 0) {
            const nextConversation = remainingConversations[0].id;
            console.log(`Selecting next conversation: ${nextConversation}`);
            setCurrentConversationId(nextConversation);
          } else {
            console.log('No conversations left, clearing current conversation ID and messages');
            setCurrentConversationId(null);
            clearMessages();
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
        console.log(`Conversation ${id} renamed to "${newTitle}"`);
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

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log(`Selecting conversation: ${conversationId}`);
    
    if (currentConversationId !== conversationId) {
      // Always clear messages first to prevent showing old conversation content
      console.log(`Conversation changed from ${currentConversationId} to ${conversationId}, clearing messages first`);
      clearMessages();
      setCurrentConversationId(conversationId);
    }
  }, [currentConversationId, clearMessages]);

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
        console.log('No conversation selected, creating a new one before sending message');
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
        const result = await updateConversationTitle(conversationId, content, conversations);
        
        // Fix: Properly access the newTitle property from the data object
        if (result.success && result.data && result.data.newTitle) {
          const newTitle = result.data.newTitle;
          console.log(`Updated conversation title to "${newTitle}"`);
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
  
  return {
    messages,
    sendMessage,
    loading,
    error,
    conversations,
    currentConversationId,
    setCurrentConversationId: handleSelectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    clearMessages
  };
}
