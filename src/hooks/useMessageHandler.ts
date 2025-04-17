
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
import { useMessageProcessing } from './message/useMessageProcessing';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { toast } from 'sonner';

// Google Workspace command detection
const GOOGLE_COMMANDS = {
  "@calendar": "CalendarAgent",
  "@sheet": "SheetsAgent",
  "@doc": "DocsAgent",
};

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
  const { isGoogleConnected, checkGooglePermissions } = useGoogleAuth();
  
  // Criar serviço de mensagens e processamento
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );
  
  const messageProcessing = useMessageProcessing(user?.id);

  /**
   * Detecta comandos do Google Workspace na mensagem
   */
  const detectGoogleCommand = useCallback((content: string): { command: string, agent: string } | null => {
    for (const [command, agent] of Object.entries(GOOGLE_COMMANDS)) {
      if (content.includes(command)) {
        return { command, agent };
      }
    }
    return null;
  }, []);

  /**
   * Verifica se o usuário tem conexão com o Google e permissões necessárias
   */
  const verifyGoogleAccess = useCallback(async (): Promise<boolean> => {
    if (!isGoogleConnected) {
      toast.error(
        'Conexão com Google necessária',
        { description: 'Por favor, conecte sua conta Google para usar este recurso.' }
      );
      return false;
    }

    const hasPermissions = await checkGooglePermissions();
    if (!hasPermissions) {
      toast.error(
        'Permissões Google insuficientes',
        { description: 'É necessário conceder permissões adicionais para esta funcionalidade.' }
      );
      return false;
    }

    return true;
  }, [isGoogleConnected, checkGooglePermissions]);

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
      setIsSending(true);
      
      // Verificar se a mensagem contém um comando do Google Workspace
      const googleCommand = detectGoogleCommand(content);
      if (googleCommand) {
        console.log(`[useMessageHandler] Comando Google detectado: ${googleCommand.command}, agente: ${googleCommand.agent}`);
        
        // Verificar se o usuário tem acesso ao Google Workspace
        const hasGoogleAccess = await verifyGoogleAccess();
        if (!hasGoogleAccess) {
          setIsSending(false);
          return false;
        }
        
        // Processar mensagem para extração de memória
        if (user && user.id) {
          messageProcessing.processUserMessageForMemory(content);
        }
        
        // Criar mensagem do usuário
        const userMessageId = uuidv4();
        const userMessage: MessageType = {
          id: userMessageId,
          content,
          sender: 'user',
          timestamp: new Date().toISOString(),
          mode,
          files,
          model: modelId
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Salvar mensagem do usuário no banco de dados
        await saveUserMessage(userMessage, currentConversationId);
        
        // Atualizar título se for a primeira mensagem
        if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'user')) {
          updateTitle(currentConversationId, content);
        }
        
        // Preparar histórico da conversa para o agente
        const conversationHistory = messageProcessing.prepareConversationHistory(
          messages.map(msg => ({ sender: msg.sender, content: msg.content }))
        );
        
        // Melhorar conteúdo com contexto de memória se necessário
        const enhancedContent = await messageProcessing.enhanceWithMemoryContext(content, messages.length);
        
        // Adicionar loading message para o agente Google
        const loadingId = `loading-${modelId}-${uuidv4()}`;
        const loadingMessage: MessageType = {
          id: loadingId,
          content: `Processando ${googleCommand.command}...`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          loading: true
        };
        
        setMessages(prev => [...prev, loadingMessage]);
        
        // Chamar o modelo com instruções específicas para o agente Google
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
          user?.id,
          // Informar que este é um comando Google para processamento especial
          { 
            googleCommand: googleCommand.command, 
            googleAgent: googleCommand.agent 
          }
        );
        
        setIsSending(false);
        return { 
          success: true, 
          modeSwitch: result?.modeSwitch || null 
        };
      }
      
      console.log(`[useMessageHandler] Enviando mensagem "${content}" para ${comparing ? 'modelos' : 'modelo'} ${leftModel || modelId}${rightModel ? ` e ${rightModel}` : ''}`);
      
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
    detectGoogleCommand,
    verifyGoogleAccess
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType
  };
}
