
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
import { useGoogleAuth } from '@/contexts/google-auth/GoogleAuthContext';
import { useMessageProcessing } from './message/useMessageProcessing';
import { processGoogleCommand, identifyGoogleAgent } from '@/agents/GoogleAgents';
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
  const { isGoogleConnected, checkGooglePermissions, googleTokens } = useGoogleAuth();
  
  // Criar serviço de mensagens e processamento
  const messageService = createMessageService(
    apiService,
    mediaGallery,
    setMessages,
    setError
  );
  
  const messageProcessing = useMessageProcessing(user?.id);

  // Helper function to prepare conversation history
  const prepareConversationHistory = (messageList: MessageType[]) => {
    return messageList.map(msg => ({ sender: msg.sender, content: msg.content }));
  };

  // Verificar permissões do Google quando necessário
  const verifyGooglePermissions = useCallback(async () => {
    if (!isGoogleConnected) {
      console.log("[useMessageHandler] Google não está conectado");
      return false;
    }
    
    // Verificar se temos tokens do Google antes de tentar verificar permissões
    if (!googleTokens?.accessToken) {
      console.log("[useMessageHandler] Tokens do Google ausentes");
      return false;
    }
    
    // Verificar se as permissões já foram verificadas através do localStorage
    const permissionsVerified = localStorage.getItem('google_permissions_verified') === 'true';
    const lastCheckStr = localStorage.getItem('google_last_permission_check');
    
    if (permissionsVerified && lastCheckStr) {
      const lastCheck = parseInt(lastCheckStr, 10);
      const now = Date.now();
      const twelveHoursInMs = 12 * 60 * 60 * 1000;
      
      // Se verificou nas últimas 12 horas, não precisamos verificar novamente
      if (now - lastCheck < twelveHoursInMs) {
        console.log("[useMessageHandler] Usando permissões do Google já verificadas");
        return true;
      }
    }
    
    try {
      console.log("[useMessageHandler] Verificando permissões do Google...");
      const hasPermissions = await checkGooglePermissions();
      console.log(`[useMessageHandler] Resultado da verificação de permissões: ${hasPermissions}`);
      
      if (hasPermissions) {
        // Salvar no localStorage para não precisar verificar novamente tão cedo
        localStorage.setItem('google_permissions_verified', 'true');
        localStorage.setItem('google_last_permission_check', Date.now().toString());
      }
      
      return hasPermissions;
    } catch (error) {
      console.error("[useMessageHandler] Erro ao verificar permissões do Google:", error);
      return false;
    }
  }, [isGoogleConnected, checkGooglePermissions, googleTokens]);

  // Detectar se mensagem é um comando de serviço Google
  const detectGoogleServiceCommand = useCallback((content: string): boolean => {
    return !!identifyGoogleAgent(content);
  }, []);

  /**
   * Função para processar comandos de serviço Google diretos (@drive, @sheet, @calendar)
   */
  const handleGoogleServiceCommand = useCallback(async (
    content: string,
    userId: string | undefined
  ) => {
    if (!userId) {
      console.error("[useMessageHandler] Usuário não autenticado");
      toast.error("Você precisa estar autenticado para usar serviços Google");
      return null;
    }
    
    // Verificar rapidamente se o Google está conectado antes de prosseguir
    if (!isGoogleConnected || !googleTokens?.accessToken) {
      console.error("[useMessageHandler] Google não está conectado ou tokens ausentes");
      toast.error("Você precisa conectar sua conta Google nas configurações");
      return null;
    }
    
    try {
      // Verificar permissões usando a verificação com cache
      console.log("[useMessageHandler] Verificando permissões para comando Google...");
      const hasPermissions = await verifyGooglePermissions();
      if (!hasPermissions) {
        console.error("[useMessageHandler] Sem permissões do Google");
        toast.error("Você precisa conceder permissão para acessar os serviços Google nas configurações", {
          action: {
            label: "Configurar",
            onClick: () => window.location.href = '/google-integrations'
          }
        });
        return null;
      }
      
      console.log("[useMessageHandler] Processando comando Google com permissões verificadas");
      
      // Processar o comando usando nosso sistema de agentes
      const result = await processGoogleCommand(userId, content);
      
      if (result.needsMoreInfo) {
        // Retornar mensagem para o usuário solicitando mais informações
        return {
          content: result.followupPrompt,
          success: true,
          isFollowupPrompt: true
        };
      }
      
      if (result.success && result.result) {
        // Formatar uma mensagem de sucesso com base nos dados retornados
        let responseContent = "Ação do Google concluída com sucesso! ";
        
        // Adicionar links para recursos criados, se disponíveis
        if (result.result.spreadsheetLink) {
          responseContent += `\n\n[Abrir planilha no Google Sheets](${result.result.spreadsheetLink})`;
        } else if (result.result.documentLink) {
          responseContent += `\n\n[Abrir documento no Google Drive](${result.result.documentLink})`;
        } else if (result.result.eventLink) {
          responseContent += `\n\n[Abrir evento no Google Calendar](${result.result.eventLink})`;
        }
        
        return {
          content: responseContent,
          success: true
        };
      }
      
      // Falha no processamento
      return {
        content: result.message || "Não foi possível processar seu comando Google",
        success: false
      };
    } catch (error) {
      console.error("[useMessageHandler] Erro ao processar comando Google:", error);
      return {
        content: `Erro ao processar comando: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        success: false
      };
    }
  }, [isGoogleConnected, verifyGooglePermissions, googleTokens]);

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
      
      // Verificar se é um comando de serviço Google
      const isGoogleServiceCommand = detectGoogleServiceCommand(content);
      
      if (isGoogleServiceCommand) {
        console.log("[useMessageHandler] Comando de serviço Google detectado:", content);
      }
      
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
        mode: isGoogleServiceCommand ? 'google-service' : mode,
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
      
      // Processar comando Google se for o caso
      if (isGoogleServiceCommand && user?.id) {
        console.log("[useMessageHandler] Processando comando Google");
        
        // Tratar o comando do serviço Google
        const googleResponse = await handleGoogleServiceCommand(content, user.id);
        
        if (googleResponse) {
          // Adicionar a resposta do agente Google à conversa
          const assistantMessage: MessageType = {
            id: uuidv4(),
            content: googleResponse.content,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            mode: 'google-service',
            model: modelId
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // Salvar a resposta no banco de dados
          await saveUserMessage(assistantMessage, currentConversationId);
          
          setIsSending(false);
          return {success: googleResponse.success, modeSwitch: null};
        }
        
        // Se falhou no processamento Google, continuar com o fluxo normal
      }
      
      // Enhance content with memory context if needed
      const enhancedContent = await messageProcessing.enhanceWithMemoryContext(content, messages.length);
      
      // Processar a mensagem
      let modeSwitch = null;
      
      if (comparing) {
        // Modo de comparação - ambos os modelos
        const result = await messageService.handleCompareModels(
          enhancedContent,
          mode,
          leftModel,
          rightModel,
          currentConversationId,
          files,
          params,
          JSON.stringify(prepareConversationHistory(messages)),
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
          JSON.stringify(prepareConversationHistory(messages)),
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
    detectGoogleServiceCommand,
    handleGoogleServiceCommand
  ]);

  return {
    sendMessage,
    isSending,
    detectContentType: messageProcessing.detectContentType,
    detectGoogleServiceCommand
  };
}
