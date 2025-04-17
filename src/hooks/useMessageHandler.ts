
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
  
  // Monitorar e depurar estado de autenticação Google
  useEffect(() => {
    console.log('[useMessageHandler] Estado de autenticação Google:', { 
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
   * Função principal para enviar mensagens para modelos
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
      
      // Verificar se é um comando Google
      const isGoogleCommand = content.match(/@(calendar|sheet|doc|drive|email)\s/i);
      
      console.log('[useMessageHandler] Verificação de comando Google:', { 
        isGoogleCommand: !!isGoogleCommand,
        isGoogleConnected,
        googleAuthLoading
      });
      
      // Verificação aprimorada de comando Google
      if (isGoogleCommand) {
        // Forçar uma atualização do estado do token antes de verificar
        if (googleAuthLoading) {
          console.log('[useMessageHandler] Esperando o carregamento da autenticação Google...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Forçar uma atualização do estado do token
          await refreshTokensState();
          
          // Verificar novamente após a atualização
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
      
      // Preparar histórico de conversação para o orquestrador
      const conversationHistory = messageProcessing.prepareConversationHistory(
        messages.map(msg => ({ sender: msg.sender, content: msg.content }))
      );
      
      // Processar a mensagem - agora processamos após a resposta do modelo!
      // Sem melhoria de conteúdo antes de enviar, apenas a mensagem original
      
      // Processar a mensagem
      let modeSwitch = null;
      
      if (comparing && leftModel && rightModel) {
        // Modo de comparação - ambos os modelos (vinculado)
        // Aqui criamos uma única mensagem de usuário sem modelo específico
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
          content, // Usar conteúdo original
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
        // Modo destacado - apenas modelo esquerdo
        // Não criamos mensagem de usuário aqui, o handler fará isso
        const result = await messageService.handleSingleModelMessage(
          content, // Usar conteúdo original
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
        // Modo destacado - apenas modelo direito
        // Não criamos mensagem de usuário aqui, o handler fará isso
        const result = await messageService.handleSingleModelMessage(
          content, // Usar conteúdo original
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
        // Modo padrão - modelo único
        // Criamos a mensagem de usuário uma única vez aqui
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
        
        // Modificação: Flag indicando que não deve criar nova mensagem de usuário
        const result = await messageService.handleSingleModelMessage(
          content, // Usar conteúdo original
          mode,
          modelId,
          currentConversationId,
          messages,
          conversations,
          files,
          params,
          conversationHistory,
          user?.id,
          // Não criar nova mensagem de usuário, pois já foi criada
          false
        );
        
        modeSwitch = result?.modeSwitch || null;
      }
      
      // Processar em segundo plano, após a mensagem ser enviada e respondida
      if (user && user.id) {
        messageProcessing.processUserMessageForMemory(content);
      }
      
      // Se esta for a primeira mensagem na conversa, atualizar o título
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
    refreshTokensState
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType
  };
}
