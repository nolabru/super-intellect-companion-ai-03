
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { createMessageService } from '@/services/messageService';
import { ConversationType } from '@/types/conversation';
import { useAuth } from '@/contexts/AuthContext';
import { memoryService } from '@/services/memoryService';

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
  
  // Create message service
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );

  // Process user message for memory extraction
  const processUserMessageForMemory = useCallback(async (content: string) => {
    if (!user || !user.id) return;
    
    try {
      // Process in background to not block the main flow
      setTimeout(async () => {
        await memoryService.extractMemoryFromMessage(content, user.id);
      }, 0);
    } catch (err) {
      console.error('[useMessageHandler] Error processing memory extraction:', err);
      // Don't block the main flow
    }
  }, [user]);

  // Get memory context for a new conversation
  const getMemoryContext = useCallback(async () => {
    if (!user || !user.id) return "";
    
    try {
      return await memoryService.getUserMemoryContext(user.id);
    } catch (err) {
      console.error('[useMessageHandler] Error getting memory context:', err);
      return "";
    }
  }, [user]);

  // Enhance content with memory context if it's a new conversation
  const enhanceWithMemoryContext = useCallback(async (content: string, msgs: MessageType[]) => {
    // Only add memory context for the first user message in a conversation
    if (msgs.length === 0 || (msgs.length === 1 && msgs[0].sender === 'user')) {
      const memoryContext = await getMemoryContext();
      
      if (memoryContext) {
        return `${memoryContext}\n\n${content}`;
      }
    }
    return content;
  }, [getMemoryContext]);

  // Detect content type and adapt the mode accordingly
  const detectAndAdaptMode = useCallback(async (
    content: string,
    currentMode: ChatMode
  ): Promise<{
    adaptedMode: ChatMode;
    adaptedModel: string;
    shouldSwitch: boolean;
  }> => {
    // Detect content type
    const detectedMode = await memoryService.detectContentTypeAndMode(content);
    
    // If detected mode is different from current mode, switch
    if (detectedMode !== currentMode) {
      // Get default model for the detected mode
      const defaultModel = memoryService.getDefaultModelForMode(detectedMode);
      
      return {
        adaptedMode: detectedMode as ChatMode,
        adaptedModel: defaultModel,
        shouldSwitch: true
      };
    }
    
    // If no mode switch needed
    return {
      adaptedMode: currentMode,
      adaptedModel: currentMode === 'text' ? 'gpt-4o' : memoryService.getDefaultModelForMode(currentMode),
      shouldSwitch: false
    };
  }, []);

  // Send message to the model
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
      
      // Process message for memory extraction
      if (user && user.id) {
        processUserMessageForMemory(content);
      }
      
      // Check if mode needs to be adapted based on content
      const { adaptedMode, adaptedModel, shouldSwitch } = await detectAndAdaptMode(content, mode);
      
      // If mode switch is needed
      if (shouldSwitch) {
        console.log(`[useMessageHandler] Mode switch detected: ${mode} -> ${adaptedMode}, model: ${adaptedModel}`);
        
        // Update parameters based on detected mode
        mode = adaptedMode;
        
        if (!comparing) {
          modelId = adaptedModel;
        } else if (leftModel && !rightModel) {
          leftModel = adaptedModel;
        }
      }
      
      // Add user message
      const userMessageId = uuidv4();
      let targetModel: string | undefined;
      
      // Determinar qual modelo receberá a mensagem
      if (comparing) {
        if (!leftModel && rightModel) {
          // Modo desvinculado - apenas modelo direito
          targetModel = rightModel;
          console.log(`[useMessageHandler] Mensagem direcionada para o modelo direito: ${rightModel}`);
        } else if (leftModel && !rightModel) {
          // Modo desvinculado - apenas modelo esquerdo
          targetModel = leftModel;
          console.log(`[useMessageHandler] Mensagem direcionada para o modelo esquerdo: ${leftModel}`);
        } else if (leftModel && rightModel) {
          // Modo vinculado - ambos modelos
          targetModel = undefined;
          console.log(`[useMessageHandler] Mensagem direcionada para ambos os modelos: ${leftModel} e ${rightModel}`);
        }
      } else {
        // Modo regular - apenas um modelo
        targetModel = modelId;
        console.log(`[useMessageHandler] Mensagem direcionada para o modelo: ${modelId}`);
      }
      
      // Criar mensagem do usuário com o modelo de destino explicitamente definido
      const userMessage: MessageType = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files,
        model: targetModel
      };
      
      console.log(`[useMessageHandler] Criando mensagem de usuário para modelo: ${targetModel || 'todos'}`);
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      await saveUserMessage(userMessage, currentConversationId);
      
      // If this is the first message in the conversation, update the title
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        console.log('[useMessageHandler] Updating conversation title');
        updateTitle(currentConversationId, content);
      }
      
      // Enhance content with memory context if needed
      const enhancedContent = await enhanceWithMemoryContext(content, messages);
      
      // Process the message
      if (comparing && leftModel && rightModel) {
        // Compare two models
        await messageService.handleCompareModels(
          enhancedContent,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          files,
          params
        );
      } else if (comparing && leftModel && !rightModel) {
        // Modo desvinculado - apenas modelo esquerdo
        await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          leftModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params
        );
      } else if (comparing && !leftModel && rightModel) {
        // Modo desvinculado - apenas modelo direito
        await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          rightModel,
          currentConversationId,
          messages,
          conversations,
          files,
          params
        );
      } else {
        // Single model - modo padrão
        await messageService.handleSingleModelMessage(
          enhancedContent,
          mode,
          modelId,
          currentConversationId,
          messages,
          conversations,
          files,
          params
        );
      }
      
      return { success: true, modeSwitch: shouldSwitch ? mode : null };
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
    processUserMessageForMemory,
    enhanceWithMemoryContext,
    detectAndAdaptMode
  ]);

  return {
    sendMessage,
    isSending
  };
}
