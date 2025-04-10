
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { saveMessageToDatabase } from '@/utils/conversationUtils';
import { ChatMode } from '@/components/ModeSelector';

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
    mode: ChatMode,
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
  const addErrorMessage = (modelId: string, mode: ChatMode) => {
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
    if (!conversationId || !message) {
      console.error('[useConversationMessages] Parâmetros inválidos para salvar mensagem de usuário');
      return { success: false, error: 'Parâmetros inválidos' };
    }
    
    try {
      console.log(`[useConversationMessages] Salvando mensagem ${message.id} na conversa ${conversationId}`);
      return await saveMessageToDatabase(message, conversationId);
    } catch (err) {
      console.error('[useConversationMessages] Erro ao salvar mensagem de usuário:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao salvar mensagem' 
      };
    }
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
