
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { createMessageService } from '@/services/messageService';
import { ConversationType } from '@/types/conversation';

export function useMessageHandler(
  messages: MessageType[],
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  conversations: ConversationType[],
  currentConversationId: string | null,
  setError: (error: string | null) => void,
  saveUserMessage: (message: MessageType, conversationId: string) => Promise<any>,
  updateTitle: (conversationId: string, content: string) => Promise<boolean>
) {
  const [isSending, setIsSending] = useState(false);
  const apiService = useApiService();
  const mediaGallery = useMediaGallery();
  
  // Create message service
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );

  // Send message to the model
  const sendMessage = useCallback(async (
    content: string,
    mode: ChatMode = 'text',
    modelId: string,
    comparing = false,
    leftModel?: string,
    rightModel?: string,
    files?: string[],
    params?: LumaParams
  ) => {
    if (!currentConversationId) {
      console.error('[useMessageHandler] Cannot send message: No conversation selected');
      setError('Nenhuma conversa selecionada. Por favor, inicie uma nova conversa.');
      return false;
    }
    
    if (isSending) {
      console.log('[useMessageHandler] Already sending a message, ignoring request');
      return false;
    }
    
    try {
      console.log(`[useMessageHandler] Sending message "${content}" to ${comparing ? 'models' : 'model'} ${leftModel || modelId}${rightModel ? ` and ${rightModel}` : ''}`);
      setIsSending(true);
      
      // Add user message
      const userMessageId = uuidv4();
      const userMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      await saveUserMessage(userMessage, currentConversationId);
      
      // If this is the first message in the conversation, update the title
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        console.log('[useMessageHandler] Updating conversation title');
        updateTitle(currentConversationId, content);
      }
      
      // Process the message
      if (comparing && leftModel && rightModel) {
        // Compare two models
        await messageService.handleCompareModels(
          content,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          files,
          params
        );
      } else {
        // Single model
        await messageService.handleSingleModelMessage(
          content,
          mode,
          modelId,
          currentConversationId,
          messages,
          conversations,
          files,
          params
        );
      }
      
      return true;
    } catch (err) {
      console.error('[useMessageHandler] Error sending message:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [
    currentConversationId, 
    isSending, 
    messages, 
    conversations,
    setMessages, 
    setError, 
    saveUserMessage, 
    updateTitle, 
    messageService
  ]);

  return {
    sendMessage,
    isSending
  };
}
