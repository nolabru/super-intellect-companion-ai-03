import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { createMessageService } from '@/services/messageService';
import { ConversationType } from '@/types/conversation';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageProcessing } from './message/useMessageProcessing';
import { useContextOrchestrator } from './useContextOrchestrator';
import { useMessageState } from './message/useMessageState';
import { useGoogleCommandHandler } from './message/useGoogleCommandHandler';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { saveMessageToDatabase } from '@/utils/conversationUtils';

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
    isSending,
    setIsSending,
    canSendMessage,
    updateLastMessage
  } = useMessageState();

  const { handleGoogleCommand } = useGoogleCommandHandler();
  
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
      
      console.log('[useMessageHandler] User message prepared:', userMessage);
      
      setMessages(prev => [...prev, userMessage]);
      await saveUserMessage(userMessage, currentConversationId);
      
      let modeSwitch = null;
      
      // Only handle image generation for Ideogram V2 model
      if (mode === 'image' && modelId === 'ideogram-v2') {
        try {
          const loadingMessageId = uuidv4();
          mediaGenerationMessageId.current = loadingMessageId;
          mediaType.current = 'image';
          
          const loadingMessage: MessageType = {
            id: loadingMessageId,
            content: `Gerando imagem...`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            loading: true
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          // Call Supabase Edge Function - use apiframe-ideogram-imagine
          const result = await supabase.functions.invoke('apiframe-ideogram-imagine', {
            body: {
              prompt: content,
              model: 'V_2', // Only use V_2 model
              style_type: params?.style_type || 'GENERAL',
              aspect_ratio: params?.aspect_ratio || 'ASPECT_1_1',
              magic_prompt_option: 'AUTO'
            }
          });
          
          if (result.error) {
            throw new Error(`Erro na função Ideogram: ${result.error.message || 'Erro desconhecido'}`);
          }
          
          if (!result.data.success || !result.data.images || result.data.images.length === 0) {
            throw new Error('Nenhuma imagem foi gerada');
          }
          
          const mediaUrl = result.data.images[0];
          
          const updatedMessage: MessageType = {
            id: loadingMessageId,
            content,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            loading: false,
            mediaUrl
          };
          
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessageId ? updatedMessage : msg
          ));
          
          // Save the message with the media URL to the database for persistence
          await saveMessageToDatabase(updatedMessage, currentConversationId);
          
          // Save to gallery
          if (mediaUrl) {
            await mediaGallery.saveMediaToGallery(mediaUrl, content, 'image', modelId);
            
            // Deduct tokens for image generation
            if (user?.id) {
              try {
                await supabase.functions.invoke('user-tokens', {
                  body: {
                    action: 'consume',
                    model_id: 'ideogram-v2',
                    mode: 'image'
                  }
                });
              } catch (err) {
                console.error('[useMessageHandler] Error consuming tokens:', err);
                // Continue even if token deduction fails
              }
            }
          }
        } catch (err) {
          console.error('[useMessageHandler] Erro ao gerar imagem:', err);
          toast.error('Erro ao gerar imagem', {
            description: err instanceof Error ? err.message : 'Erro desconhecido'
          });
          
          setMessages(prev => [...prev, {
            id: uuidv4(),
            content: `Erro ao gerar imagem: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            model: modelId,
            mode,
            error: true
          }]);
        }
      } else if (comparing && leftModel && rightModel) {
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
      
      if (user?.id) {
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
    contextOrchestrator,
    handleGoogleCommand,
    canSendMessage,
    updateLastMessage,
    mediaGallery
  ]);

  return {
    sendMessage,
    isSending,
    files: [],
    filePreviewUrls: [],
    handleFileChange: () => {},
    removeFile: () => {},
    isMediaUploading: false,
    detectContentType: messageProcessing.detectContentType
  };
}
