
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { useApiService } from './useApiService';
import { useMediaGallery } from './useMediaGallery';
import { ConversationType } from '@/types/conversation';
import { saveMessageToDatabase } from '@/utils/conversationUtils';
import { createMessageService } from '@/services/messageService';
import { useConversationState } from './useConversationState';
import { useConversationMessages } from './useConversationMessages';
import { 
  createNewConversation as createNewConversationAction,
  deleteConversation as deleteConversationAction,
  renameConversation as renameConversationAction,
  loadMessages as loadMessagesAction,
  handleTitleUpdate
} from './conversationActions';

// Use export type for re-exporting types when isolatedModules is enabled
export type { ConversationType };

export function useConversation() {
  const {
    conversations,
    currentConversationId,
    loading,
    error,
    setLoading,
    setError,
    setCurrentConversationId,
    addConversation,
    updateConversationTitle,
    removeConversation
  } = useConversationState();
  
  const {
    messages,
    setMessages,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages
  } = useConversationMessages();
  
  const apiService = useApiService();
  const { saveMediaToGallery, saving } = useMediaGallery();
  
  // Create message service with dependencies
  const messageService = createMessageService(
    apiService,
    { saveMediaToGallery, saving },
    setMessages,
    (errorMessage: string) => setError(errorMessage)
  );

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    loadMessagesAction(
      currentConversationId,
      setLoading,
      setMessages,
      clearMessages,
      setError
    );
  }, [currentConversationId]);

  // Handle selecting a conversation
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log(`[useConversation] Selecting conversation: ${conversationId}`);
    
    // Always clear messages first to prevent showing old conversation content
    clearMessages();
    
    // Then set the current conversation ID
    setCurrentConversationId(conversationId);
  }, [clearMessages, setCurrentConversationId]);

  // Create a new conversation
  const createNewConversation = async () => {
    return await createNewConversationAction(
      setLoading,
      addConversation,
      clearMessages,
      setError
    );
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    return await deleteConversationAction(
      id,
      setLoading,
      removeConversation,
      setError
    );
  };

  // Rename a conversation
  const renameConversation = async (id: string, newTitle: string) => {
    return await renameConversationAction(
      id,
      newTitle,
      setLoading,
      updateConversationTitle,
      setError
    );
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
        console.log('[useConversation] No conversation selected, creating a new one before sending message');
        await createNewConversation();
        
        // If still no conversation ID, something went wrong
        if (!currentConversationId) {
          throw new Error("Não foi possível criar uma nova conversa");
        }
      }
      
      const conversationId = currentConversationId!;
      
      // Add user message first
      const userMessageId = addUserMessage(content, mode, files);
      
      // Get the user message from the messages array
      const userMessage = messages.find(msg => msg.id === userMessageId);
      if (!userMessage) {
        throw new Error("Erro ao criar mensagem do usuário");
      }
      
      // Save user message to database
      await saveMessageToDatabase(userMessage, conversationId);
      
      // Update conversation title if this is the first message
      if (messages.length === 1) { // Only the user message we just added
        await handleTitleUpdate(conversationId, content, conversations, updateConversationTitle);
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
      console.error('[useConversation] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
      
      // Add a general error message if we haven't already added one
      if (!messages.some(msg => msg.error && msg.timestamp > new Date(Date.now() - 5000).toISOString())) {
        // Remove any loading messages
        removeLoadingMessages();
        
        // Add error message
        const errorMessage = addErrorMessage(modelId, mode);
        
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
