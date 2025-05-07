
import { useConversationState } from './useConversationState';
import { useConversationMessages } from './useConversationMessages';
import { useMessageHandler } from './useMessageHandler';
import { useConversationNavigation } from './useConversationNavigation';
import {
  createNewConversation,
  deleteConversation,
  renameConversation,
  loadMessages,
  handleTitleUpdate
} from './conversationActions';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useConversation() {
  const conversationState = useConversationState();
  const messagesState = useConversationMessages();
  const navigate = useNavigate();
  
  // Flag to prevent multiple simultaneous loading operations
  const loadingRef = useRef(false);
  // Track if initial loading has been done
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Track the last loaded conversation ID to avoid redundant loading
  const lastLoadedConversationRef = useRef<string | null>(null);
  // Flag to prevent multiple conversation deletion operations
  const deletingRef = useRef(false);
  // Track if any critical operation is in progress
  const isOperationInProgressRef = useRef(false);
  // State to track deletion operation
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Integration with URL-based navigation system
  const { navigateToConversation, navigateToNewConversation } = useConversationNavigation(
    currentConversationId,
    setCurrentConversationId,
    conversations
  );

  // Message handling hook
  const { sendMessage, isSending } = useMessageHandler(
    messages,
    setMessages,
    conversations,
    currentConversationId,
    setError,
    saveUserMessage,
    handleTitleUpdate.bind(null, conversations, updateConversationTitle)
  );

  // Clear and explicit function to load conversation messages
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    console.log(`[useConversation] Loading messages for conversation: ${conversationId}`);
    
    if (!conversationId) {
      console.log('[useConversation] Invalid conversation ID, ignoring load');
      return false;
    }
    
    if (loadingRef.current || isOperationInProgressRef.current) {
      console.log('[useConversation] Already loading messages or operation in progress, ignoring request');
      return false;
    }
    
    try {
      // Set flag to prevent multiple calls
      loadingRef.current = true;
      isOperationInProgressRef.current = true;
      setLoading(true);
      
      // Clear messages before loading new ones for immediate visual feedback
      clearMessages();
      
      // Update the reference of the last loaded conversation
      lastLoadedConversationRef.current = conversationId;
      
      // Load messages for the selected conversation
      const success = await loadMessages(
        conversationId,
        setLoading,
        setMessages,
        clearMessages,
        setError
      );
      
      if (success) {
        setInitialLoadDone(true);
        console.log(`[useConversation] Message loading completed for conversation: ${conversationId}`);
        return true;
      } else {
        console.error(`[useConversation] Failed to load messages for conversation: ${conversationId}`);
        return false;
      }
    } catch (err) {
      console.error("[useConversation] Error loading messages:", err);
      setError(err instanceof Error ? err.message : 'Unknown error loading messages');
      return false;
    } finally {
      // Always reset loading flag when operation completes
      setTimeout(() => {
        loadingRef.current = false;
        isOperationInProgressRef.current = false;
        setLoading(false);
      }, 500);
    }
  }, [clearMessages, setError, setLoading, setMessages]);

  // Function to force message reload
  const forceReloadMessages = useCallback(() => {
    if (currentConversationId) {
      console.log(`[useConversation] Forcing conversation reload: ${currentConversationId}`);
      // Reset tracking variables to force reload
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
      // Clear messages first for immediate visual feedback
      clearMessages();
      // Load messages for the current conversation
      loadConversationMessages(currentConversationId);
    } else {
      console.log('[useConversation] No selected conversation to reload');
      // Just clear messages when no conversation is selected
      clearMessages();
    }
  }, [currentConversationId, loadConversationMessages, clearMessages]);

  // Effect to load messages when conversation changes
  useEffect(() => {
    console.log(`[useConversation] Conversation loading effect triggered. Current ID: ${currentConversationId}`);
    
    if (!currentConversationId) {
      // If no conversation is selected, clear messages
      console.log('[useConversation] No conversation selected, clearing messages');
      clearMessages();
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
      return;
    }
    
    // Check if we need to load this conversation
    const needToLoadConversation = 
      currentConversationId !== lastLoadedConversationRef.current || 
      !initialLoadDone;
    
    if (needToLoadConversation && !loadingRef.current && !isOperationInProgressRef.current) {
      console.log(`[useConversation] Change detected, loading conversation: ${currentConversationId}`);
      // Load messages for the selected conversation
      loadConversationMessages(currentConversationId);
    } else {
      console.log('[useConversation] No need to reload current conversation');
    }
  }, [currentConversationId, clearMessages, loadConversationMessages, initialLoadDone]);

  // Create a new conversation with updated navigation
  const handleCreateNewConversation = async () => {
    console.log('[useConversation] Creating new conversation');
    
    // Prevent creating a new conversation while an operation is in progress
    if (isOperationInProgressRef.current) {
      console.log('[useConversation] Operation already in progress, ignoring request');
      toast.error('Operação em andamento, aguarde...');
      return false;
    }
    
    try {
      // Set operation flag
      isOperationInProgressRef.current = true;
      
      // Force immediate message clearing for visual feedback
      clearMessages();
      
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
        
        // Force message clearing again after conversation is created
        clearMessages();
        
        // Reset tracking variables to force an update
        lastLoadedConversationRef.current = data.id;
        setInitialLoadDone(true);
        
        // Set the current conversation ID and update the URL
        setCurrentConversationId(data.id);
        
        // Allow some time for state updates before navigation
        setTimeout(() => {
          navigateToNewConversation(data.id);
        }, 300);
        
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
      // Reset operation flags with delay
      setTimeout(() => {
        isOperationInProgressRef.current = false;
        setLoading(false);
      }, 500);
    }
  };

  // Delete conversation with navigation update
  const handleDeleteConversation = async (id: string) => {
    // Prevent multiple delete operations or while other operations are in progress
    if (isOperationInProgressRef.current || deletingRef.current || isDeleting) {
      console.log('[useConversation] Operation already in progress, ignoring delete request');
      toast.error('Operação em andamento, aguarde...');
      return false;
    }
    
    try {
      // Set deletion flags
      deletingRef.current = true;
      isOperationInProgressRef.current = true;
      setIsDeleting(true);
      
      // Show deletion in progress toast
      const toastId = toast.loading('Excluindo conversa...');
      
      console.log(`[useConversation] Deleting conversation: ${id}`);
      
      // Clear messages and reset current conversation ID first for immediate UI feedback
      clearMessages();
      
      const wasCurrentConversation = id === currentConversationId;
      
      if (wasCurrentConversation) {
        // Reset the current conversation ID with delay to ensure UI updates
        setCurrentConversationId(null);
        lastLoadedConversationRef.current = null;
        setInitialLoadDone(false);
        
        // Find next available conversation
        const nextConversation = conversations.find(conv => conv.id !== id);
        
        // Wait a bit before actual deletion to let UI update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Delete the current conversation
        const result = await deleteConversation(
          id, 
          setLoading, 
          removeConversation,
          setError
        );
        
        if (!result) {
          console.error('[useConversation] Failed to delete conversation');
          toast.error('Erro ao excluir conversa', { id: toastId });
          return false;
        }
        
        // Show success toast
        toast.success('Conversa excluída com sucesso', { id: toastId });
        
        // Allow state to update before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to the next conversation or home page
        if (nextConversation) {
          console.log(`[useConversation] Navigating to next conversation: ${nextConversation.id}`);
          navigateToConversation(nextConversation.id);
        } else {
          console.log('[useConversation] No more conversations, navigating to home page');
          navigate('/', { replace: true });
        }
      } else {
        // For non-active conversations, just delete
        const result = await deleteConversation(
          id, 
          setLoading, 
          removeConversation,
          setError
        );
        
        if (!result) {
          console.error('[useConversation] Failed to delete conversation');
          toast.error('Erro ao excluir conversa', { id: toastId });
          return false;
        }
        
        // Show success toast
        toast.success('Conversa excluída com sucesso', { id: toastId });
      }
      
      return true;
    } catch (err) {
      console.error('[useConversation] Error deleting conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error deleting conversation');
      toast.error('Erro ao excluir conversa');
      return false;
    } finally {
      // Reset deletion flags with delay
      setTimeout(() => {
        deletingRef.current = false;
        isOperationInProgressRef.current = false;
        setIsDeleting(false);
      }, 600);
    }
  };

  // Rename conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    // Prevent renaming during operations
    if (isOperationInProgressRef.current) {
      console.log('[useConversation] Operation in progress, ignoring rename request');
      toast.error('Operação em andamento, aguarde...');
      return false;
    }
    
    try {
      isOperationInProgressRef.current = true;
      return await renameConversation(
        id, 
        newTitle, 
        setLoading, 
        updateConversationTitle,
        setError
      );
    } finally {
      setTimeout(() => {
        isOperationInProgressRef.current = false;
      }, 300);
    }
  };

  // Update conversation title based on message content
  const handleUpdateTitle = async (conversationId: string, content: string) => {
    if (isOperationInProgressRef.current) {
      return false;
    }
    
    try {
      isOperationInProgressRef.current = true;
      return await handleTitleUpdate(
        conversations,
        updateConversationTitle,
        conversationId,
        content
      );
    } finally {
      setTimeout(() => {
        isOperationInProgressRef.current = false;
      }, 300);
    }
  };

  return {
    // State
    messages,
    conversations,
    currentConversationId,
    loading,
    error,
    initialLoadDone,
    isDeleting,
    
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
    loadMessages: loadConversationMessages,
    forceReloadMessages,
    
    // Conversation actions
    updateConversations,
    createNewConversation: handleCreateNewConversation,
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    updateTitle: handleUpdateTitle,
    
    // Navigation
    navigateToConversation
  };
}
