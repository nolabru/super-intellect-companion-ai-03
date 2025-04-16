
import { supabase } from '@/integrations/supabase/client';

/**
 * Repositório para interação com a tabela de memória do usuário no banco de dados
 */
export const userMemoryRepository = {
  /**
   * Obtém todo o contexto de memória de um usuário
   * @param userId ID do usuário
   * @returns Contexto de memória formatado como string
   */
  async getMemoryContext(userId: string): Promise<string> {
    try {
      if (!userId) {
        console.warn('[userMemoryRepository] ID de usuário não fornecido para buscar memória');
        return "";
      }
      
      const { data, error } = await supabase
        .from('user_memory')
        .select('key_name, value')
        .eq('user_id', userId);
      
      if (error) {
        console.error('[userMemoryRepository] Erro ao buscar memória do usuário:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return "";
      }
      
      return "User information from previous conversations:\n" + 
        data.map(item => `- ${item.key_name}: ${item.value}`).join('\n');
    } catch (err) {
      console.error('[userMemoryRepository] Erro ao obter contexto de memória:', err);
      return "";
    }
  },
  
  /**
   * Armazena itens de memória extraídos no banco de dados
   * @param memoryItems Itens de memória a serem armazenados
   * @param userId ID do usuário
   * @returns Resultado da operação
   */
  async storeMemoryItems(memoryItems: any[], userId: string) {
    try {
      if (!memoryItems || memoryItems.length === 0 || !userId) {
        return { success: true, error: null };
      }
      
      // Preparar os itens para inserção ou atualização
      const preparedItems = memoryItems.map(item => ({
        user_id: userId,
        key_name: item.key.trim(),
        value: item.value.trim(),
        source: item.source || 'message-extraction',
        title: item.title || 'Auto-extracted'
      }));
      
      // Usar transação upsert (insert com conflito em user_id + key_name)
      const { error } = await supabase
        .from('user_memory')
        .upsert(preparedItems, { 
          onConflict: 'user_id,key_name',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('[userMemoryRepository] Erro ao armazenar itens de memória:', error);
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('[userMemoryRepository] Erro ao armazenar itens na memória:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido' 
      };
    }
  }
};
