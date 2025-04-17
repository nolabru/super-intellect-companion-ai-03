
import { useState, useCallback } from 'react';
import { ChatMode } from '@/components/ModeSelector';
import { memoryService } from '@/services/memoryService';
import { filterMessagesForContext, formatMessagesForContext, prepareFullContext } from '@/utils/contextUtils';
import { MessageType } from '@/components/ChatMessage';

/**
 * Hook para processar mensagens de usuário, extrair memória e preparar contexto
 */
export function useMessageProcessing(userId?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * Processa a mensagem do usuário para extração de memória
   */
  const processUserMessageForMemory = useCallback(async (content: string) => {
    if (!userId) {
      console.log('[useMessageProcessing] Sem userId, não processando para memória');
      return;
    }
    
    try {
      setIsProcessing(true);
      console.log(`[useMessageProcessing] Processando mensagem para memória: ${content.substring(0, 50)}...`);
      
      // Process in background to not block the main flow
      setTimeout(async () => {
        try {
          const result = await memoryService.extractMemoryFromMessage(content, userId);
          console.log(`[useMessageProcessing] Memória extraída: ${result.memoryItems.length} itens`);
          setIsProcessing(false);
        } catch (error) {
          console.error('[useMessageProcessing] Erro ao processar memória em background:', error);
          setIsProcessing(false);
        }
      }, 0);
    } catch (err) {
      console.error('[useMessageProcessing] Erro no processamento de extração de memória:', err);
      setIsProcessing(false);
      // Don't block the main flow
    }
  }, [userId]);

  /**
   * Obtém o contexto de memória para uma nova conversa
   */
  const getMemoryContext = useCallback(async () => {
    if (!userId) {
      console.log('[useMessageProcessing] Sem userId, retornando contexto vazio');
      return "";
    }
    
    try {
      console.log(`[useMessageProcessing] Obtendo contexto de memória para usuário ${userId}`);
      const context = await memoryService.getUserMemoryContext(userId);
      console.log(`[useMessageProcessing] Contexto de memória obtido: ${context.length} caracteres`);
      return context;
    } catch (err) {
      console.error('[useMessageProcessing] Erro ao obter contexto de memória:', err);
      return "";
    }
  }, [userId]);

  /**
   * Prepara o histórico da conversa para o orquestrador
   */
  const prepareConversationHistory = useCallback((messages: MessageType[]): string => {
    if (!messages || messages.length === 0) {
      console.log('[useMessageProcessing] Sem mensagens para preparar contexto');
      return "";
    }
    
    console.log(`[useMessageProcessing] Preparando histórico com ${messages.length} mensagens`);
    
    // Filtrar mensagens relevantes para o contexto
    const filteredMessages = filterMessagesForContext(messages);
    console.log(`[useMessageProcessing] Após filtragem: ${filteredMessages.length} mensagens relevantes`);
    
    // Formatar as mensagens para contexto
    const formattedContext = formatMessagesForContext(filteredMessages);
    console.log(`[useMessageProcessing] Contexto formatado: ${formattedContext.length} caracteres`);
    
    return formattedContext;
  }, []);
  
  /**
   * Detecta o tipo de conteúdo e sugere alteração de modo
   */
  const detectContentType = useCallback(async (content: string): Promise<ChatMode> => {
    try {
      console.log(`[useMessageProcessing] Detectando tipo de conteúdo: ${content.substring(0, 50)}...`);
      const detectedMode = await memoryService.detectContentTypeAndMode(content);
      console.log(`[useMessageProcessing] Modo detectado: ${detectedMode}`);
      return detectedMode as ChatMode;
    } catch (err) {
      console.error('[useMessageProcessing] Erro ao detectar tipo de conteúdo:', err);
      return 'text';
    }
  }, []);

  return {
    processUserMessageForMemory,
    getMemoryContext,
    prepareConversationHistory,
    detectContentType,
    isProcessing
  };
}
