
import { supabase } from '@/integrations/supabase/client';
import { userMemoryRepository } from './memory/userMemoryRepository';
import { contentAnalysisService } from './memory/contentAnalysisService';

/**
 * Serviço para gerenciamento de memória do usuário e análise de conteúdo
 */
export const memoryService = {
  /**
   * Extrai memória de uma mensagem usando o orquestrador
   * @param messageContent Conteúdo da mensagem
   * @param userId ID do usuário
   * @returns Resultado da extração com itens de memória
   */
  async extractMemoryFromMessage(messageContent: string, userId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('memory-extractor', {
        body: {
          messageContent,
          userId,
          useOrchestrator: true // Flag para indicar uso do orquestrador
        },
      });
      
      if (error) {
        console.error('[memoryService] Erro extraindo memória:', error);
        return { success: false, error, memoryItems: [] };
      }
      
      // Se extraiu itens de memória, armazená-los
      if (data.memoryItems && data.memoryItems.length > 0) {
        await userMemoryRepository.storeMemoryItems(data.memoryItems, userId);
      }
      
      return { 
        success: true, 
        error: null, 
        memoryItems: data.memoryItems || [] 
      };
    } catch (err) {
      console.error('[memoryService] Erro chamando extrator de memória:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido', 
        memoryItems: [] 
      };
    }
  },
  
  /**
   * Obtém o contexto de memória do usuário para um novo chat
   * @param userId ID do usuário
   * @returns Contexto de memória formatado como string
   */
  async getUserMemoryContext(userId: string) {
    return userMemoryRepository.getMemoryContext(userId);
  },
  
  /**
   * Detecta o tipo de conteúdo e sugere alteração de modo
   * @param messageContent Conteúdo da mensagem
   * @returns Modo sugerido
   */
  async detectContentTypeAndMode(messageContent: string) {
    return contentAnalysisService.detectContentTypeAndMode(messageContent);
  },
  
  /**
   * Método de fallback para detectar o tipo de conteúdo por padrões
   * @param messageContent Conteúdo da mensagem
   * @returns Modo sugerido
   */
  detectContentTypeByPatterns(messageContent: string) {
    return contentAnalysisService.detectContentTypeByPatterns(messageContent);
  },
  
  /**
   * Obtém o modelo padrão para um determinado modo
   * @param mode Modo de chat
   * @returns ID do modelo padrão
   */
  getDefaultModelForMode(mode: string) {
    return contentAnalysisService.getDefaultModelForMode(mode);
  }
};
