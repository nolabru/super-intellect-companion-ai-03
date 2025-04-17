
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { createMessageService } from '@/services/messageService';
import { ConversationType } from '@/types/conversation';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageProcessing } from './message/useMessageProcessing';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { toast } from 'sonner';
import { useContextOrchestrator } from './useContextOrchestrator';

/**
 * Hook central para gerenciamento de envio de mensagens e contexto
 */
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
  const [lastMessageSent, setLastMessageSent] = useState<string | null>(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const apiService = useApiService();
  const mediaGallery = useMediaGallery();
  const { user } = useAuth();
  const { isGoogleConnected, loading: googleAuthLoading, refreshTokensState } = useGoogleAuth();
  const contextOrchestrator = useContextOrchestrator();
  
  useEffect(() => {
    console.log('[useMessageHandler] Estado de autenticação Google:', { 
      isGoogleConnected, 
      googleAuthLoading 
    });
  }, [isGoogleConnected, googleAuthLoading]);
  
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );
  
  const messageProcessing = useMessageProcessing(user?.id);

  // Log do estado atual de mensagens para depuração
  useEffect(() => {
    console.log(`[useMessageHandler] Estado de mensagens atualizado, total: ${messages.length}`);
  }, [messages]);

  const sendMessage = useCallback(async (
    content: string,
    mode: ChatMode = 'text',
    modelId: string,
    comparing = false,
    leftModel?: string | null,
    rightModel?: string | null,
    files?: string[],
    params?: LumaParams
  ) => {
    if (!currentConversationId) {
      console.error('[useMessageHandler] Cannot send message: No conversation selected');
      setError('No conversation selected. Please start a new conversation.');
      return false;
    }
    
    if (isSending) {
      console.log('[useMessageHandler] Already sending a message, ignoring request');
      return false;
    }
    
    const now = Date.now();
    if (
      content === lastMessageSent && 
      now - lastMessageTimestamp < 2000
    ) {
      console.log('[useMessageHandler] Prevented duplicate message submission');
      toast.info('Aguarde um momento antes de enviar a mesma mensagem novamente');
      return false;
    }
    
    setLastMessageSent(content);
    setLastMessageTimestamp(now);
    
    try {
      console.log(`[useMessageHandler] Sending message "${content}" to ${comparing ? 'models' : 'model'} ${leftModel || modelId}${rightModel ? ` and ${rightModel}` : ''}`);
      setIsSending(true);
      
      // Verificar comandos Google
      const isGoogleCommand = content.match(/@(calendar|sheet|doc|drive|email)\s/i);
      
      console.log('[useMessageHandler] Verificação de comando Google:', { 
        isGoogleCommand: !!isGoogleCommand,
        isGoogleConnected,
        googleAuthLoading
      });
      
      if (isGoogleCommand) {
        if (googleAuthLoading) {
          console.log('[useMessageHandler] Esperando o carregamento da autenticação Google...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await refreshTokensState();
          
          if (!isGoogleConnected) {
            toast.error(
              'Conta Google não conectada',
              { description: 'Para usar comandos Google, você precisa fazer login com sua conta Google.' }
            );
            setIsSending(false);
            return false;
          }
        } else if (!isGoogleConnected) {
          toast.error(
            'Conta Google não conectada',
            { description: 'Para usar comandos Google, você precisa fazer login com sua conta Google.' }
          );
          setIsSending(false);
          return false;
        }
      }
      
      // Use the context orchestrator to build context
      console.log(`[useMessageHandler] Building context for conversation ${currentConversationId}`);
      const contextResult = await contextOrchestrator.buildContext(
        currentConversationId,
        comparing ? (leftModel || modelId) : modelId,
        mode
      );
      
      // Log context details
      console.log(`[useMessageHandler] Context built: ${contextResult.contextLength} chars, ${contextResult.includedMessages.length} messages`);
      
      let modeSwitch = null;
      
      if (comparing && leftModel && rightModel) {
        const userMessageId = uuidv4();
        const userMessage: MessageType = {
          id: userMessageId,
          content,
          sender: 'user',
          timestamp: new Date().toISOString(),
          mode
        };
        
        setMessages(prev => [...prev, userMessage]);
        await saveUserMessage(userMessage, currentConversationId);
        
        const result = await messageService.handleCompareModels(
          content,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          messages,
          files,
          params,
          contextResult.formattedContext,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else if (comparing && leftModel && !rightModel) {
        const result = await messageService.handleSingleModelMessage(
          content,
          mode,
          leftModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          contextResult.formattedContext,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else if (comparing && !leftModel && rightModel) {
        const result = await messageService.handleSingleModelMessage(
          content,
          mode,
          rightModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          contextResult.formattedContext,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else {
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
        await saveUserMessage(userMessage, currentConversationId);
        
        const result = await messageService.handleSingleModelMessage(
          content,
          mode,
          modelId,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          contextResult.formattedContext,
          user?.id,
          true // Skip adding user message as we already did it
        );
        
        modeSwitch = result?.modeSwitch || null;
      }
      
      if (user && user.id) {
        messageProcessing.processUserMessageForMemory(content);
      }
      
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        updateTitle(currentConversationId, content);
      }
      
      return { 
        success: true, 
        modeSwitch: modeSwitch ? modeSwitch.newMode : null 
      };
    } catch (err) {
      console.error('[useMessageHandler] Error sending message:', err);
      return { success: false, modeSwitch: null };
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
    messageService,
    user,
    messageProcessing,
    isGoogleConnected,
    googleAuthLoading,
    refreshTokensState,
    lastMessageSent,
    lastMessageTimestamp,
    contextOrchestrator
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType
  };
}
