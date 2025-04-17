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
  const { isGoogleConnected, loading: googleAuthLoading } = useGoogleAuth();
  
  // Monitorar e debugar o estado da conexão Google
  useEffect(() => {
    console.log('[useMessageHandler] Google Auth State:', { 
      isGoogleConnected, 
      googleAuthLoading 
    });
  }, [isGoogleConnected, googleAuthLoading]);
  
  // Criar serviço de mensagens e processamento
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );
  
  const messageProcessing = useMessageProcessing(user?.id);

  /**
   * Função principal para enviar mensagens aos modelos
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
      console.error('[useMessageHandler] Não é possível enviar mensagem: Nenhuma conversa selecionada');
      setError('Nenhuma conversa selecionada. Por favor, inicie uma nova conversa.');
      return false;
    }
    
    if (isSending) {
      console.log('[useMessageHandler] Já está enviando uma mensagem, ignorando solicitação');
      return false;
    }
    
    try {
      console.log(`[useMessageHandler] Enviando mensagem "${content}" para ${comparing ? 'modelos' : 'modelo'} ${leftModel || modelId}${rightModel ? ` e ${rightModel}` : ''}`);
      setIsSending(true);
      
      // Verificar se é um comando do Google e se o usuário está conectado
      const isGoogleCommand = content.match(/@(calendar|sheet|doc|drive|email)\s/i);
      
      console.log('[useMessageHandler] Google command check:', { 
        isGoogleCommand: !!isGoogleCommand,
        isGoogleConnected,
        googleAuthLoading
      });
      
      // Verificação de comandos Google melhorada
      if (isGoogleCommand) {
        // Aguarde a conclusão do carregamento da autenticação Google antes de verificar
        if (googleAuthLoading) {
          console.log('[useMessageHandler] Aguardando carregamento da autenticação Google...');
          // Aguardar breve tempo para carregar a autenticação
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('[useMessageHandler] Estado final da conexão Google:', { isGoogleConnected });
        
        // Verificação final após aguardar
        if (!isGoogleConnected) {
          toast.error(
            'Conta Google não conectada',
            { description: 'Para usar comandos do Google, você precisa fazer login com sua conta Google.' }
          );
          setIsSending(false);
          return false;
        }
      }
      
      // Processar mensagem para extração de memória
      if (user && user.id) {
        messageProcessing.processUserMessageForMemory(content);
      }
      
      // Preparar histórico da conversa para o orquestrador
      const conversationHistory = messageProcessing.prepareConversationHistory(
        messages.map(msg => ({ sender: msg.sender, content: msg.content }))
      );
      
      // Criar mensagem do usuário
      const userMessageId = uuidv4();
      let targetModel: string | undefined;
      
      // Determinar qual modelo receberá a mensagem
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
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      await saveUserMessage(userMessage, currentConversationId);
      
      // If this is the first message in the conversation, update the title
      if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
        updateTitle(currentConversationId, content);
      }
      
      // Enhance content with memory context if needed
      const enhancedContent = await messageProcessing.enhanceWithMemoryContext(content, messages.length);
      
      // Processar a mensagem
      let modeSwitch = null;
      
      if (comparing && leftModel && rightModel) {
        // Modo de comparação - ambos os modelos
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
        // Modo desvinculado - apenas modelo esquerdo
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
        // Modo desvinculado - apenas modelo direito
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
        // Modo padrão - apenas um modelo
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
      console.error('[useMessageHandler] Erro ao enviar mensagem:', err);
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
    googleAuthLoading
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType
  };
}
