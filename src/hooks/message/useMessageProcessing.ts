
import { useState, useCallback } from 'react';
import { ChatMode } from '@/components/ModeSelector';
import { memoryService } from '@/services/memoryService';

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
  const prepareConversationHistory = useCallback((messages: { sender: string, content: string }[]): string => {
    if (!messages || messages.length === 0) {
      return "";
    }
    
    console.log(`[useMessageProcessing] Preparando histórico com ${messages.length} mensagens`);
    
    // Incluir até 15 mensagens recentes para o contexto
    const recentMessages = messages.slice(-15);
    
    const formattedHistory = recentMessages.map(msg => {
      const role = msg.sender === 'user' ? 'Usuário' : 'Assistente';
      
      // Limpar conteúdo muito grande
      let cleanContent = msg.content;
      cleanContent = cleanContent.replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]');
      cleanContent = cleanContent.replace(/(https?:\/\/[^\s]{50,})/g, '[URL]');
      
      return `${role}: ${cleanContent}`;
    }).join('\n\n');
    
    return formattedHistory;
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
