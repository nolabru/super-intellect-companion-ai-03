
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
    if (!userId) return;
    
    try {
      setIsProcessing(true);
      // Process in background to not block the main flow
      setTimeout(async () => {
        await memoryService.extractMemoryFromMessage(content, userId);
        setIsProcessing(false);
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
    if (!userId) return "";
    
    try {
      return await memoryService.getUserMemoryContext(userId);
    } catch (err) {
      console.error('[useMessageProcessing] Erro ao obter contexto de memória:', err);
      return "";
    }
  }, [userId]);

  /**
   * Melhora o conteúdo com contexto de memória se for uma nova conversa
   */
  const enhanceWithMemoryContext = useCallback(async (content: string, messageCount: number) => {
    // Only add memory context for the first user message in a conversation
    if (messageCount === 0 || messageCount === 1) {
      const memoryContext = await getMemoryContext();
      
      if (memoryContext) {
        return `${memoryContext}\n\n${content}`;
      }
    }
    return content;
  }, [getMemoryContext]);

  /**
   * Prepara o histórico da conversa para o orquestrador
   */
  const prepareConversationHistory = useCallback((messages: { sender: string, content: string }[]): string => {
    // Limitar a quantidade de mensagens anteriores (últimas 10, por exemplo)
    const recentMessages = messages.slice(-10);
    
    return recentMessages.map(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  }, []);
  
  /**
   * Detecta o tipo de conteúdo e sugere alteração de modo
   */
  const detectContentType = useCallback(async (content: string): Promise<ChatMode> => {
    try {
      const detectedMode = await memoryService.detectContentTypeAndMode(content);
      return detectedMode as ChatMode;
    } catch (err) {
      console.error('[useMessageProcessing] Erro ao detectar tipo de conteúdo:', err);
      return 'text';
    }
  }, []);

  return {
    processUserMessageForMemory,
    getMemoryContext,
    enhanceWithMemoryContext,
    prepareConversationHistory,
    detectContentType,
    isProcessing
  };
}
