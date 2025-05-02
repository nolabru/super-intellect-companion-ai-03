
import { useCallback, useRef } from 'react';
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
import { apiframeService } from '@/services/apiframeService';
import { useApiframeGeneration } from './useApiframeGeneration';
import { getApiframeModelId, isApiframeModel } from '@/utils/modelMapping';

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
  
  const apiframeGeneration = useApiframeGeneration({
    onProgress: (progress) => {
      if (mediaGenerationMessageId.current) {
        setMessages(prev => prev.map(msg => 
          msg.id === mediaGenerationMessageId.current 
            ? { ...msg, content: `Gerando ${mediaType.current}... ${progress.toFixed(0)}%` } 
            : msg
        ));
      }
    }
  });
  
  const mediaGenerationMessageId = useRef<string | null>(null);
  const mediaType = useRef<'image' | 'video' | 'audio'>('image');

  const sendMessage = useCallback(async (
    content: string,
    mode: ChatMode = 'text',
    modelId: string,
    comparing = false,
    leftModel?: string | null,
    rightModel?: string | null,
    newFiles?: string[],
    params?: any
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

      // Adicionar logs para debugar os arquivos
      console.log('[useMessageHandler] Sending message with files:', newFiles);

      const canProceed = await handleGoogleCommand(content);
      if (!canProceed) {
        setIsSending(false);
        return false;
      }
      
      const userMessageId = uuidv4();
      const userMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files: newFiles
      };
      
      // Adicione logs para debugar
      console.log('[useMessageHandler] User message prepared:', userMessage);
      
      setMessages(prev => [...prev, userMessage]);
      await saveUserMessage(userMessage, currentConversationId);
      
      let modeSwitch = null;
      
      if ((mode === 'image' || mode === 'video' || mode === 'audio') && 
          (isApiframeModel(modelId))) {
        
        try {
          const loadingMessageId = uuidv4();
          mediaGenerationMessageId.current = loadingMessageId;
          
          let mediaTypeValue: 'image' | 'video' | 'audio' = 'image';
          if (mode === 'video') mediaTypeValue = 'video';
          if (mode === 'audio') mediaTypeValue = 'audio';
          mediaType.current = mediaTypeValue;
          
          const loadingMessage: MessageType = {
            id: loadingMessageId,
            content: `Gerando ${mediaTypeValue}...`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            loading: true
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          const apiframeModelId = getApiframeModelId(modelId);
          
          console.log(`[useMessageHandler] Iniciando geração de ${mediaTypeValue} com modelo ${apiframeModelId}`);
          
          // Check if API key is configured
          if (!apiframeService.isApiKeyConfigured()) {
            throw new Error("Chave de API da APIframe não está configurada. Configure na opção 'Serviços APIframe'");
          }
          
          let result;
          
          try {
            // Use apiframeGeneration hook instead of direct API service
            result = await apiframeGeneration.generateMedia(
              content,
              mediaTypeValue,
              apiframeModelId as any,
              params || {},
              newFiles?.[0]
            );
          } catch (err) {
            console.error(`[useMessageHandler] Erro na geração de mídia:`, err);
            throw new Error(`Erro ao criar tarefa: ${err instanceof Error ? err.message : String(err)}`);
          }
          
          if (!result || !result.success) {
            throw new Error(result?.error || "Erro desconhecido ao gerar mídia");
          }
          
          const taskId = result.taskId;
          
          if (!taskId) {
            throw new Error("ID de tarefa não recebido");
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessageId 
              ? { 
                  ...msg, 
                  content: `${mediaTypeValue.charAt(0).toUpperCase() + mediaTypeValue.slice(1)} sendo processado. ID da tarefa: ${taskId}`,
                } 
              : msg
          ));

          // If we already have a mediaUrl in the result, update the message now
          if (result.mediaUrl) {
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessageId 
                ? { 
                    ...msg, 
                    content: `${content}`,
                    loading: false,
                    mediaUrl: result.mediaUrl
                  } 
                : msg
            ));
            
            mediaGallery.saveMediaToGallery(result.mediaUrl, content, mediaTypeValue, modelId);
          }
        } catch (err) {
          console.error('[useMessageHandler] Erro ao gerar mídia:', err);
          toast.error('Erro ao gerar mídia', {
            description: err instanceof Error ? err.message : 'Erro desconhecido'
          });
          
          setMessages(prev => [...prev, {
            id: uuidv4(),
            content: `Erro ao gerar mídia: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            error: true
          }]);
        }
      } else {
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
            await contextOrchestrator.buildContext(
              currentConversationId,
              comparing ? (leftModel || modelId) : modelId,
              mode
            ).then(r => r.formattedContext),
            user?.id
          );
          
          modeSwitch = result?.modeSwitch || null;
        } else {
          console.log(`[useMessageHandler] Modo único: enviando para modelo ${modelId}`);
          
          const result = await messageService.handleSingleModelMessage(
            content,
            mode,
            modelId,
            currentConversationId,
            messages,
            conversations,
            newFiles,
            params,
            await contextOrchestrator.buildContext(
              currentConversationId,
              modelId,
              mode
            ).then(r => r.formattedContext),
            user?.id,
            true
          );
          
          modeSwitch = result?.modeSwitch || null;
        }
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
    updateLastMessage,
    mediaGallery
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
