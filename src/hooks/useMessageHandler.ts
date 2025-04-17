
import { useCallback } from 'react';
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
import { useContextOrchestrator } from './useContextOrchestrator';
import { useMediaHandling } from './message/useMediaHandling';
import { useMessageState } from './message/useMessageState';
import { useGoogleCommandHandler } from './message/useGoogleCommandHandler';
import { toast } from 'sonner';

export function useMessageHandler(
  messages: MessageType[],
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  conversations: ConversationType[],
  currentConversationId: string | null,
  setError: (error: string | null) => void,
  saveUserMessage: (message: MessageType, conversationId: string) => Promise<any>,
  updateTitle: (conversationId: string, content: string) => Promise<boolean>
) {
  const { user } = useAuth();
  const apiService = useApiService();
  const mediaGallery = useMediaGallery();
  const contextOrchestrator = useContextOrchestrator();
  const messageService = createMessageService(apiService, mediaGallery, setMessages, setError);
  const messageProcessing = useMessageProcessing(user?.id);
  
  const {
    files,
    filePreviewUrls,
    isMediaUploading,
    handleFileChange,
    removeFile,
    clearFiles,
    uploadFiles
  } = useMediaHandling();

  const {
    isSending,
    setIsSending,
    canSendMessage,
    updateLastMessage
  } = useMessageState();

  const { handleGoogleCommand } = useGoogleCommandHandler();

  const sendMessage = useCallback(async (
    content: string,
    mode: ChatMode = 'text',
    modelId: string,
    comparing = false,
    leftModel?: string | null,
    rightModel?: string | null,
    newFiles?: string[],
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

    if (!canSendMessage(content)) {
      console.log('[useMessageHandler] Prevented duplicate message submission');
      toast.info('Aguarde um momento antes de enviar a mesma mensagem novamente');
      return false;
    }

    updateLastMessage(content);
    
    try {
      setIsSending(true);

      // Handle Google commands
      const canProceed = await handleGoogleCommand(content);
      if (!canProceed) {
        setIsSending(false);
        return false;
      }
      
      // Melhorar o log para debugar contexto
      console.log(`[useMessageHandler] Construindo contexto para conversa ${currentConversationId}, modelo ${comparing ? (leftModel || modelId) : modelId}`);
      
      // Build message context
      const contextResult = await contextOrchestrator.buildContext(
        currentConversationId,
        comparing ? (leftModel || modelId) : modelId,
        mode
      );
      
      // Adicionar logs para verificar se o contexto está sendo construído corretamente
      console.log(`[useMessageHandler] Contexto construído: ${contextResult.formattedContext.length} caracteres`);
      console.log(`[useMessageHandler] Primeiros 150 caracteres: ${contextResult.formattedContext.substring(0, 150)}...`);
      
      let modeSwitch = null;
      
      if (comparing && leftModel && rightModel) {
        console.log(`[useMessageHandler] Modo comparação: enviando para modelos ${leftModel} e ${rightModel}`);
        const result = await messageService.handleCompareModels(
          content,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          messages,
          newFiles,
          params,
          contextResult.formattedContext,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else {
        console.log(`[useMessageHandler] Modo único: enviando para modelo ${modelId}`);
        const userMessageId = uuidv4();
        const userMessage: MessageType = {
          id: userMessageId,
          content,
          sender: 'user',
          timestamp: new Date().toISOString(),
          mode,
          files: newFiles
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
          newFiles,
          params,
          contextResult.formattedContext,
          user?.id,
          true
        );
        
        modeSwitch = result?.modeSwitch || null;
      }
      
      if (user?.id) {
        messageProcessing.processUserMessageForMemory(content);
      }
      
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        updateTitle(currentConversationId, content);
      }

      clearFiles();
      
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
    contextOrchestrator,
    clearFiles,
    handleGoogleCommand,
    canSendMessage,
    updateLastMessage
  ]);

  return {
    sendMessage,
    isSending,
    files,
    filePreviewUrls,
    handleFileChange,
    removeFile,
    isMediaUploading,
    detectContentType: messageProcessing.detectContentType
  };
}
