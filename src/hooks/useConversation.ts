
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
import { toast } from 'sonner';

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
    if (!currentConversationId) {
      // If no conversation is selected, clear messages
      console.log('[useConversation] No conversation selected, clearing messages');
      clearMessages();
      setMessages([]);
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
      return;
    }
    
    // Only proceed if we have a valid conversation ID that's different from the last loaded one
    if (!loadingRef.current && 
        (currentConversationId !== lastLoadedConversationRef.current || !initialLoadDone)) {
      
      console.log(`[useConversation] Loading conversation: ${currentConversationId}`);
      
      // Force clear messages before loading new ones for visual feedback
      clearMessages();
      setMessages([]); 
      
      // Set flag to prevent multiple calls
      loadingRef.current = true;
      
      // Update the last loaded conversation reference
      lastLoadedConversationRef.current = currentConversationId;
      
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
        console.log(`[useConversation] Finished loading conversation: ${currentConversationId}`);
      })
      .catch((err) => {
        console.error("[useConversation] Error loading messages:", err);
        setError(err instanceof Error ? err.message : 'Unknown error loading messages');
      })
      .finally(() => {
        // Always reset loading flag when operation finishes
        loadingRef.current = false;
      });
    }
  }, [currentConversationId, clearMessages, setMessages, setLoading, setError, initialLoadDone]);

  // Create a new conversation with improved message clearing
  const handleCreateNewConversation = async () => {
    console.log('[useConversation] Creating new conversation');
    
    try {
      // Force-clear messages immediately for visual feedback
      clearMessages();
      setMessages([]);
      
      // Set loading state
      setLoading(true);
      
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
        clearMessages();
        setMessages([]);
        
        // Reset tracking variables to force a refresh
        lastLoadedConversationRef.current = data.id;
        setInitialLoadDone(true);
        
        // Set the current conversation ID explicitly
        setCurrentConversationId(data.id);
        
        toast.success('Nova conversa criada');
        return true;
      } else {
        console.error('[useConversation] Failed to create new conversation');
        toast.error('Erro ao criar nova conversa');
        return false;
      }
    } catch (err) {
      console.error('[useConversation] Error creating new conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error creating conversation');
      toast.error('Erro ao criar nova conversa');
      return false;
    } finally {
      setLoading(false);
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
        setMessages([]);
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
