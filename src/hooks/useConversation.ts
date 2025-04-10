
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
import { useEffect, useRef, useState } from 'react';

export function useConversation() {
  const conversationState = useConversationState();
  const messagesState = useConversationMessages();
  
  // Flag to prevent multiple simultaneous loading operations
  const loadingRef = useRef(false);
  // Track if initial load has been performed
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Track the last loaded conversation ID to prevent redundant loads
  const lastLoadedConversationRef = useRef<string | null>(null);
  
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

  // Improved loading messages when conversation changes
  useEffect(() => {
    // Only proceed if we have a valid conversation ID that's different from the last loaded one
    if (currentConversationId && 
        !loadingRef.current && 
        (currentConversationId !== lastLoadedConversationRef.current || !initialLoadDone)) {
      console.log(`[useConversation] Current conversation changed to ${currentConversationId}, loading messages`);
      
      // Update the last loaded conversation reference
      lastLoadedConversationRef.current = currentConversationId;
      
      // Set flag to prevent multiple calls
      loadingRef.current = true;
      
      // Important: Clear messages BEFORE loading new ones
      clearMessages();
      
      // Load messages for the selected conversation
      loadMessages(
        currentConversationId,
        setLoading,
        setMessages,
        clearMessages,
        setError
      )
      .then(() => {
        setInitialLoadDone(true);
      })
      .catch((err) => {
        console.error("[useConversation] Error loading messages:", err);
        setError(err instanceof Error ? err.message : 'Unknown error loading messages');
      })
      .finally(() => {
        // Always reset loading flag when operation finishes
        loadingRef.current = false;
      });
    } else if (!currentConversationId) {
      console.log('[useConversation] No conversation selected, clearing messages');
      clearMessages();
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
    }
  }, [currentConversationId, clearMessages, setMessages, setLoading, setError, initialLoadDone]);

  // Create a new conversation with improved message clearing
  const handleCreateNewConversation = async () => {
    console.log('[useConversation] Creating new conversation');
    
    try {
      // First ensure messages are cleared
      clearMessages();
      
      // Create the new conversation
      const { success, data } = await createNewConversation(
        setLoading, 
        addConversation, 
        clearMessages,
        setError
      );
      
      if (success && data) {
        console.log(`[useConversation] New conversation created successfully with ID: ${data.id}`);
        
        // Force clear messages again after new conversation is created
        setMessages([]);
        
        // Reset tracking variables to force a refresh
        lastLoadedConversationRef.current = data.id;
        setInitialLoadDone(true);
        
        // Explicitly set the current conversation ID
        setCurrentConversationId(data.id);
        
        return true;
      } else {
        console.error('[useConversation] Failed to create new conversation');
        return false;
      }
    } catch (err) {
      console.error('[useConversation] Error creating new conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error creating conversation');
      return false;
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const result = await deleteConversation(
        id, 
        setLoading, 
        removeConversation,
        setError
      );
      
      // If this was the current conversation, force a refresh when a new one is selected
      if (id === currentConversationId) {
        lastLoadedConversationRef.current = null;
        setInitialLoadDone(false);
        clearMessages();
      }
      
      return result;
    } catch (err) {
      console.error('[useConversation] Error deleting conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error deleting conversation');
      return false;
    }
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
    initialLoadDone,
    
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
