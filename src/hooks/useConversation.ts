
import { useConversationState } from './useConversationState';
import { useConversationMessages } from './useConversationMessages';
import { useMessageHandler } from './useMessageHandler';
import {
  createNewConversation,
  deleteConversation,
  renameConversation,
  loadMessages,
  handleTitleUpdate
} from './conversationActions';
import { useEffect, useRef } from 'react';

export function useConversation() {
  const conversationState = useConversationState();
  const messagesState = useConversationMessages();
  
  // Reference to track if messages are already being loaded
  const loadingRef = useRef(false);
  
  const { 
    conversations,
    currentConversationId,
    loading,
    error,
    setLoading,
    setError,
    setCurrentConversationId,
    updateConversations,
    addConversation,
    updateConversationTitle,
    removeConversation
  } = conversationState;
  
  const {
    messages,
    setMessages,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages
  } = messagesState;

  // Message handler hook
  const { sendMessage, isSending } = useMessageHandler(
    messages,
    setMessages,
    conversations,
    currentConversationId,
    setError,
    saveUserMessage,
    handleTitleUpdate.bind(null, conversations, updateConversationTitle)
  );

  // Load messages when conversation changes - com proteção contra loops
  useEffect(() => {
    if (currentConversationId && !loadingRef.current) {
      console.log(`[useConversation] Current conversation changed to ${currentConversationId}, loading messages`);
      
      // Definir flag para evitar múltiplas chamadas
      loadingRef.current = true;
      
      loadMessages(
        currentConversationId,
        setLoading,
        setMessages,
        clearMessages,
        setError
      ).finally(() => {
        // Resetar flag quando a operação terminar
        loadingRef.current = false;
      });
    } else if (!currentConversationId) {
      console.log('[useConversation] No conversation selected, clearing messages');
      clearMessages();
    }
  }, [currentConversationId, clearMessages, setMessages, setLoading, setError]);

  // Create a new conversation
  const handleCreateNewConversation = async () => {
    console.log('[useConversation] Creating new conversation');
    
    // Clear messages first to ensure we start fresh
    clearMessages();
    
    const success = await createNewConversation(
      setLoading, 
      addConversation, 
      clearMessages,
      setError
    );
    
    // Clear messages again after state is updated with the new conversation ID
    if (success) {
      clearMessages();
    }
    
    return success;
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    return await deleteConversation(
      id, 
      setLoading, 
      removeConversation,
      setError
    );
  };

  // Rename conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    return await renameConversation(
      id, 
      newTitle, 
      setLoading, 
      updateConversationTitle,
      setError
    );
  };

  // Update conversation title based on message content
  const handleUpdateTitle = async (conversationId: string, content: string) => {
    return await handleTitleUpdate(
      conversations,
      updateConversationTitle,
      conversationId,
      content
    );
  };

  return {
    // State
    messages,
    conversations,
    currentConversationId,
    loading,
    error,
    
    // State setters
    setMessages,
    setCurrentConversationId,
    setLoading,
    setError,
    
    // Message actions
    sendMessage,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages,
    
    // Conversation actions
    updateConversations,
    createNewConversation: handleCreateNewConversation,
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    updateTitle: handleUpdateTitle
  };
}
