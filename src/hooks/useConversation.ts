
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { useApiService } from './useApiService';
import { useMediaGallery } from './useMediaGallery';
import { toast } from 'sonner';
import { ConversationType, ConversationState, DbOperationResult } from '@/types/conversation';
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
  const [conversationState, setConversationState] = useState<ConversationState>({
    conversations: [],
    currentConversationId: null,
    loading: false,
    error: null
  });
  
  const apiService = useApiService();
  const { saveMediaToGallery, saving } = useMediaGallery();
  
  // Create message service with complete mediaGallery object including the 'saving' property
  const messageService = createMessageService(
    apiService,
    { saveMediaToGallery, saving },
    setMessages,
    (error) => setConversationState(prev => ({ ...prev, error: error }))
  );

  // Clear messages - explicit function to ensure messages are cleared
  const clearMessages = useCallback(() => {
    console.log('[useConversation] Clearing all messages');
    setMessages([]);
  }, []);

  // Load user conversations on init
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setConversationState(prev => ({ ...prev, loading: true }));
        const { data, error: fetchError } = await loadUserConversations();
        
        if (fetchError) {
          console.error('[useConversation] Error loading conversations:', fetchError);
          setConversationState(prev => ({ ...prev, error: fetchError }));
          return;
        }
        
        if (data) {
          console.log(`[useConversation] Loaded ${data.length} conversations`);
          
          // Select most recent conversation if none is selected and there are conversations available
          const updatedState: Partial<ConversationState> = { conversations: data };
          
          if (!conversationState.currentConversationId && data.length > 0) {
            console.log(`[useConversation] Auto-selecting the most recent conversation: ${data[0].id}`);
            updatedState.currentConversationId = data[0].id;
          }
          
          setConversationState(prev => ({ ...prev, ...updatedState }));
        }
      } catch (err) {
        console.error('[useConversation] Error loading conversations:', err);
        setConversationState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Erro desconhecido ao buscar conversas'
        }));
      } finally {
        setConversationState(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchConversations();
  }, []);
  
  // Load conversation messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      const { currentConversationId } = conversationState;
      
      if (!currentConversationId) {
        console.log('[useConversation] No conversation selected, clearing messages');
        clearMessages();
        return;
      }
      
      try {
        setConversationState(prev => ({ ...prev, loading: true }));
        console.log(`[useConversation] Loading messages for conversation: ${currentConversationId}`);
        
        const { data, error: fetchError } = await loadConversationMessages(currentConversationId);
        
        if (fetchError) {
          console.error('[useConversation] Error loading messages:', fetchError);
          setConversationState(prev => ({ ...prev, error: fetchError }));
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
          
          console.log(`[useConversation] Setting ${formattedMessages.length} messages from conversation ${currentConversationId}`);
          setMessages(formattedMessages);
        } else {
          console.log('[useConversation] No messages found, clearing message state');
          clearMessages();
        }
      } catch (err) {
        console.error('[useConversation] Error fetching messages:', err);
        setConversationState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Erro desconhecido ao buscar mensagens'
        }));
        toast.error('Erro ao carregar mensagens da conversa');
      } finally {
        setConversationState(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchMessages();
  }, [conversationState.currentConversationId, clearMessages]);

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      setConversationState(prev => ({ ...prev, loading: true }));
      
      // Clear messages before creating a new conversation
      console.log('[useConversation] Creating new conversation, clearing messages first');
      clearMessages();
      
      const { data, error: createError, success } = await createConversation();
      
      if (createError) {
        console.error('[useConversation] Error creating conversation:', createError);
        setConversationState(prev => ({ ...prev, error: createError }));
        return;
      }
      
      if (data && success) {
        console.log(`[useConversation] New conversation created with ID: ${data.id}`);
        
        setConversationState(prev => ({
          ...prev,
          currentConversationId: data.id,
          conversations: [data, ...prev.conversations]
        }));
      }
    } catch (err) {
      console.error('[useConversation] Error creating conversation:', err);
      setConversationState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao criar nova conversa'
      }));
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }));
    }
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    try {
      setConversationState(prev => ({ ...prev, loading: true }));
      
      const { success, error: deleteError } = await deleteConversationUtil(id);
      
      if (deleteError) {
        console.error('[useConversation] Error deleting conversation:', deleteError);
        setConversationState(prev => ({ ...prev, error: deleteError }));
        return;
      }
      
      if (success) {
        console.log(`[useConversation] Conversation ${id} deleted successfully`);
        
        setConversationState(prev => {
          const updatedState: Partial<ConversationState> = {
            conversations: prev.conversations.filter(conv => conv.id !== id)
          };
          
          if (prev.currentConversationId === id) {
            console.log('[useConversation] Current conversation was deleted, selecting next available one');
            // If current conversation was deleted, select the next available one or clear
            const remainingConversations = prev.conversations.filter(conv => conv.id !== id);
            
            if (remainingConversations.length > 0) {
              const nextConversation = remainingConversations[0].id;
              console.log(`[useConversation] Selecting next conversation: ${nextConversation}`);
              updatedState.currentConversationId = nextConversation;
            } else {
              console.log('[useConversation] No conversations left, clearing current conversation ID');
              updatedState.currentConversationId = null;
              clearMessages();
            }
          }
          
          return { ...prev, ...updatedState };
        });
      }
    } catch (err) {
      console.error('[useConversation] Error deleting conversation:', err);
      setConversationState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa'
      }));
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }));
    }
  };

  // Rename a conversation
  const renameConversation = async (id: string, newTitle: string) => {
    try {
      setConversationState(prev => ({ ...prev, loading: true }));
      
      const { success, error: renameError } = await renameConversationUtil(id, newTitle);
      
      if (renameError) {
        console.error('[useConversation] Error renaming conversation:', renameError);
        setConversationState(prev => ({ ...prev, error: renameError }));
        return;
      }
      
      if (success) {
        console.log(`[useConversation] Conversation ${id} renamed to "${newTitle}"`);
        setConversationState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv => 
            conv.id === id ? { ...conv, title: newTitle } : conv
          )
        }));
      }
    } catch (err) {
      console.error('[useConversation] Error renaming conversation:', err);
      setConversationState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa'
      }));
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log(`[useConversation] Selecting conversation: ${conversationId}`);
    
    // Always clear messages first to prevent showing old conversation content
    clearMessages();
    
    // Then set the current conversation ID
    setConversationState(prev => ({
      ...prev, 
      currentConversationId: conversationId
    }));
  }, [clearMessages]);

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
      setConversationState(prev => ({ ...prev, loading: true }));
      
      // Create new conversation if none is selected
      if (!conversationState.currentConversationId) {
        console.log('[useConversation] No conversation selected, creating a new one before sending message');
        await createNewConversation();
        
        // If still no conversation ID, something went wrong
        if (!conversationState.currentConversationId) {
          throw new Error("Não foi possível criar uma nova conversa");
        }
      }
      
      const conversationId = conversationState.currentConversationId!;
      
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
        const result = await updateConversationTitle(conversationId, content, conversationState.conversations);
        
        // Properly access the newTitle property from the data object
        if (result.success && result.data && 'newTitle' in result.data) {
          const newTitle = result.data.newTitle;
          console.log(`[useConversation] Updated conversation title to "${newTitle}"`);
          
          setConversationState(prev => ({
            ...prev,
            conversations: prev.conversations.map(conv => 
              conv.id === conversationId ? { ...conv, title: newTitle } : conv
            )
          }));
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
          conversationState.conversations,
          files, 
          params
        );
      }
    } catch (err) {
      console.error('[useConversation] Error sending message:', err);
      setConversationState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem'
      }));
      
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
        if (conversationState.currentConversationId) {
          await saveMessageToDatabase(errorMessage, conversationState.currentConversationId);
        }
      }
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }));
    }
  };
  
  return {
    messages,
    sendMessage,
    loading: conversationState.loading,
    error: conversationState.error,
    conversations: conversationState.conversations,
    currentConversationId: conversationState.currentConversationId,
    setCurrentConversationId: handleSelectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    clearMessages
  };
}
