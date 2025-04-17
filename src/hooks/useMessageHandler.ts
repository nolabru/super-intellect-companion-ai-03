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

/**
 * Hook central para gerenciamento de envio de mensagens
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
  const apiService = useApiService();
  const mediaGallery = useMediaGallery();
  const { user } = useAuth();
  const { isGoogleConnected, loading: googleAuthLoading, refreshTokensState } = useGoogleAuth();
  
  // Monitor and debug Google auth state
  useEffect(() => {
    console.log('[useMessageHandler] Google Auth State:', { 
      isGoogleConnected, 
      googleAuthLoading 
    });
  }, [isGoogleConnected, googleAuthLoading]);
  
  // Create message service and processing
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );
  
  const messageProcessing = useMessageProcessing(user?.id);

  /**
   * Main function to send messages to models
   */
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
    
    try {
      console.log(`[useMessageHandler] Sending message "${content}" to ${comparing ? 'models' : 'model'} ${leftModel || modelId}${rightModel ? ` and ${rightModel}` : ''}`);
      setIsSending(true);
      
      // Check if it's a Google command
      const isGoogleCommand = content.match(/@(calendar|sheet|doc|drive|email)\s/i);
      
      console.log('[useMessageHandler] Google command check:', { 
        isGoogleCommand: !!isGoogleCommand,
        isGoogleConnected,
        googleAuthLoading
      });
      
      // Enhanced Google command checking
      if (isGoogleCommand) {
        // Force a token state refresh before checking
        if (googleAuthLoading) {
          console.log('[useMessageHandler] Waiting for Google auth to load...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Force a refresh of token state
          await refreshTokensState();
          
          // Check again after refresh
          if (!isGoogleConnected) {
            toast.error(
              'Google account not connected',
              { description: 'To use Google commands, you need to log in with your Google account.' }
            );
            setIsSending(false);
            return false;
          }
        } else if (!isGoogleConnected) {
          toast.error(
            'Google account not connected',
            { description: 'To use Google commands, you need to log in with your Google account.' }
          );
          setIsSending(false);
          return false;
        }
      }
      
      // Process message for memory extraction
      if (user && user.id) {
        messageProcessing.processUserMessageForMemory(content);
      }
      
      // Prepare conversation history for orchestrator
      const conversationHistory = messageProcessing.prepareConversationHistory(
        messages.map(msg => ({ sender: msg.sender, content: msg.content }))
      );
      
      // Create user message
      const userMessageId = uuidv4();
      let targetModel: string | undefined;
      
      // Determine which model will receive the message
      if (comparing) {
        if (!leftModel && rightModel) {
          targetModel = rightModel;
        } else if (leftModel && !rightModel) {
          targetModel = leftModel;
        } else if (leftModel && rightModel) {
          targetModel = undefined;
        }
      } else {
        targetModel = modelId;
      }
      
      // Create user message with target model explicitly defined
      const userMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files,
        model: targetModel
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      await saveUserMessage(userMessage, currentConversationId);
      
      // If this is the first message in the conversation, update the title
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        updateTitle(currentConversationId, content);
      }
      
      // Enhance content with memory context if needed
      const enhancedContent = await messageProcessing.enhanceWithMemoryContext(content, messages.length);
      
      // Process the message
      let modeSwitch = null;
      
      if (comparing && leftModel && rightModel) {
        // Comparison mode - both models
        const result = await messageService.handleCompareModels(
          enhancedContent,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          files,
          params,
          conversationHistory,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else if (comparing && leftModel && !rightModel) {
        // Detached mode - left model only
        const result = await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          leftModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          conversationHistory,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else if (comparing && !leftModel && rightModel) {
        // Detached mode - right model only
        const result = await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          rightModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          conversationHistory,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
      } else {
        // Default mode - single model
        const result = await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          modelId,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          conversationHistory,
          user?.id
        );
        
        modeSwitch = result?.modeSwitch || null;
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
    refreshTokensState
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType
  };
}
