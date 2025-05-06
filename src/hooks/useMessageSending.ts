
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { useConversation } from './useConversation';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMode } from '@/components/ModeSelector';
import { toast } from 'sonner';
import { createMessageService } from '@/services/messageService';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';

export function useMessageSending(
  activeMode: ChatMode = 'text',
  comparing = false,
  isLinked = false,
  leftModel = 'gpt-3.5-turbo',
  rightModel = 'gpt-4o',
  generationParams = {},
  isMobile = false,
  sidebarOpen = false,
  onSidebar?: () => void
) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { user } = useAuth();
  
  // Replace the adapters with direct service hooks
  const apiService = useApiService();
  const mediaGallery = useMediaGallery();
  const conversation = useConversation();
  
  // Create message service using our available services
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setApiKeyError
  );
  
  // Add a new state for tracking if we should show URLs only
  const [showUrlOnly, setShowUrlOnly] = useState<boolean>(false);

  // Load messages whenever conversation ID changes
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!currentConversationId) {
        setMessages([]);
        setInitialLoadDone(true);
        return;
      }
      
      setMessagesLoading(true);
      try {
        const loadedMessages = await conversation.loadMessages(currentConversationId);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setMessagesLoading(false);
        setInitialLoadDone(true);
      }
    };
    
    loadInitialMessages();
  }, [currentConversationId, conversation]);

  // Modified handleSendMessage function to accept a showUrlOnly parameter
  const handleSendMessage = async (
    content: string, 
    files: string[] = [], 
    params: any = null,
    targetModel?: string,
    options: { showUrlOnly?: boolean } = {}
  ) => {
    if (!content && files.length === 0) return;
    if (!user) {
      console.warn('User not authenticated. Cannot send message.');
      return;
    }

    const modelToUse = targetModel || (comparing ? (isLinked ? leftModel : rightModel) : leftModel);
    const modeToUse = params?.outputMode || activeMode;

    const userMessage: MessageType = {
      id: uuidv4(),
      content: content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      files: files
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Optimistically update conversation - use updateTitle instead of updateConversation
    if (conversation.updateTitle && currentConversationId) {
      try {
        conversation.updateTitle(currentConversationId, content);
      } catch (error) {
        console.error('Error updating conversation title:', error);
      }
    }

    // Prepare AI message
    const aiMessageBase: Partial<MessageType> = {
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      loading: true,
      mode: params?.outputMode || activeMode,
      showUrlOnly: options.showUrlOnly
    };

    let aiMessage: MessageType = {
      ...aiMessageBase,
      id: `loading-${uuidv4()}`,
      content: comparing ? `Thinking as ${modelToUse}...` : 'Thinking...'
    } as MessageType;

    setMessages(prevMessages => [...prevMessages, aiMessage]);

    try {
      // Abort previous request if it exists
      if (abortController) {
        abortController.abort();
      }

      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      let responseContent = '';
      setStreaming(true);

      // Use the conversation object's improved message handling instead
      if (comparing && !isLinked) {
        // For comparison mode (not linked)
        await messageService.handleCompareModels(
          content,
          modeToUse as ChatMode,
          leftModel,
          rightModel,
          currentConversationId || '',
          messages,
          files,
          params
        );
      } else {
        // For single model or linked comparison
        await messageService.handleSingleModelMessage(
          content,
          modeToUse as ChatMode,
          modelToUse,
          currentConversationId || '',
          messages,
          conversation.conversations || [],
          files,
          params,
          undefined,
          user?.id,
          false
        );
      }

      // Save the messages to the database
      if (currentConversationId && conversation.saveUserMessage) {
        await conversation.saveUserMessage(userMessage, currentConversationId);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessage = 'Erro ao enviar mensagem';

      if (error.message === 'API key not configured') {
        errorMessage = 'Chave da API não configurada. Por favor, configure a chave da API nas configurações.';
        setApiKeyError(errorMessage);
      } else if (error.message === 'Rate limit reached') {
        errorMessage = 'Limite de requisições alcançado. Por favor, tente novamente mais tarde.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Requisição abortada.';
      }

      // Fix the type error by using a function update to modify the message with the error
      setMessages(prevMessages => {
        return prevMessages.map(msg =>
          msg.id === aiMessage.id ? {
            ...msg,
            content: errorMessage,
            loading: false,
            error: true
          } : msg
        );
      });
      
      toast.error("Erro ao enviar mensagem", {
        description: errorMessage,
        duration: 4000
      });
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  };

  // New function to toggle URL-only view
  const toggleUrlOnly = () => {
    setShowUrlOnly(prev => !prev);
  };

  return {
    messages,
    messagesLoading,
    initialLoadDone,
    currentConversationId,
    setCurrentConversationId,
    handleSendMessage,
    toggleUrlOnly,
    showUrlOnly
  };
}
