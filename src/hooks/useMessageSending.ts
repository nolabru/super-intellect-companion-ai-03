import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChatServiceAdapter } from '@/adapters/chatServiceAdapter';
import { useMediaServiceAdapter } from '@/adapters/mediaServiceAdapter';
import { MessageType } from '@/components/ChatMessage';
import { useConversation } from './useConversation';
import { useAuth } from '@/contexts/AuthContext';

export function useMessageSending(
  activeMode = 'text',
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
  
  const chatService = useChatServiceAdapter();
  const mediaService = useMediaServiceAdapter();
  const conversation = useConversation();
  
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

    // Optimistically update conversation
    conversation.updateConversation(currentConversationId, content);

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

      await chatService.sendMessage(
        content,
        modelToUse,
        modeToUse,
        files,
        params,
        newAbortController.signal,
        (partialResponse: string) => {
          responseContent += partialResponse;
          aiMessage = {
            ...aiMessage,
            content: responseContent,
            loading: false,
            streaming: true
          };

          setMessages(prevMessages => {
            const updatedMessages = prevMessages.map(msg =>
              msg.id === aiMessage.id ? aiMessage : msg
            );
            return updatedMessages;
          });
        }
      );

      aiMessage = {
        ...aiMessage,
        content: responseContent,
        loading: false,
        streaming: false,
        model: modelToUse
      };

      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg =>
          msg.id === aiMessage.id ? aiMessage : msg
        );
        return updatedMessages;
      });

      // Handle media generation if needed
      if (modeToUse === 'image' || modeToUse === 'video' || modeToUse === 'audio') {
        aiMessage = {
          ...aiMessage,
          loading: true,
          content: 'Gerando mídia...'
        };

        setMessages(prevMessages => {
          const updatedMessages = prevMessages.map(msg =>
            msg.id === aiMessage.id ? aiMessage : msg
          );
          return updatedMessages;
        });

        const mediaParams = {
          ...params,
          outputMode: modeToUse
        };

        // Generate media and update the message
        mediaService.generateMedia(
          modeToUse,
          content,
          modelToUse,
          mediaParams
        );
      }

      // Save the messages to the database
      await conversation.saveMessage(currentConversationId, userMessage);
      await conversation.saveMessage(currentConversationId, aiMessage);
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

      aiMessage = {
        ...aiMessage,
        content: errorMessage,
        loading: false,
        error: true
      };

      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg =>
          msg.id === aiMessage.id ? aiMessage : msg
        );
        return updatedMessages;
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
