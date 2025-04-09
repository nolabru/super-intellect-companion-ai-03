
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { saveMessageToDatabase } from '@/utils/conversationUtils';

export function useConversationMessages() {
  const [messages, setMessages] = useState<MessageType[]>([]);

  // Clear messages
  const clearMessages = useCallback(() => {
    console.log('[useConversationMessages] Clearing all messages');
    setMessages([]);
  }, []);

  // Add a user message 
  const addUserMessage = (
    content: string, 
    mode: string,
    files?: string[]
  ): string => {
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
    return userMessageId;
  };

  // Add an assistant message
  const addAssistantMessage = (message: MessageType) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  // Add error message
  const addErrorMessage = (modelId: string, mode: string) => {
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
    return errorMessage;
  };

  // Save user message to database
  const saveUserMessage = async (message: MessageType, conversationId: string) => {
    return await saveMessageToDatabase(message, conversationId);
  };

  // Remove loading messages
  const removeLoadingMessages = () => {
    setMessages((prevMessages) => 
      prevMessages.filter(msg => !msg.id?.startsWith('loading-'))
    );
  };

  return {
    messages,
    setMessages,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages
  };
}
