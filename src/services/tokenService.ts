
import { supabase } from '@/integrations/supabase/client';

export interface TokenBalance {
  tokensRemaining: number;
  tokensUsed: number;
  nextResetDate: string | null;
}

export interface TokenConsumptionRate {
  modelId: string;
  mode: string;
  tokensPerRequest: number;
}

/**
 * Serviço para gerenciar tokens de usuários
 */
export const tokenService = {
  /**
   * Obtém o saldo de tokens do usuário
   */
  async getUserTokenBalance(userId?: string): Promise<TokenBalance> {
    try {
      if (!userId) {
        console.log('[tokenService] Sem ID de usuário, retornando valores padrão');
        return {
          tokensRemaining: 10000,
          tokensUsed: 0,
          nextResetDate: null
        };
      }
      
      console.log(`[tokenService] Obtendo saldo de tokens para usuário ${userId}`);
      
      const { data, error } = await supabase.functions.invoke('user-tokens', {
        body: { action: 'balance' }
      });
      
      if (error) {
        console.error('[tokenService] Erro ao obter saldo de tokens:', error);
        throw new Error(`Erro ao obter saldo de tokens: ${error.message}`);
      }
      
      if (!data || !data.tokens) {
        console.error('[tokenService] Resposta inválida:', data);
        throw new Error('Resposta inválida do serviço de tokens');
      }
      
      console.log(`[tokenService] Saldo de tokens obtido:`, data.tokens);
      
      return {
        tokensRemaining: data.tokens.tokens_remaining || 0,
        tokensUsed: data.tokens.tokens_used || 0,
        nextResetDate: data.tokens.next_reset_date || null
      };
    } catch (err) {
      console.error('[tokenService] Erro ao obter saldo de tokens:', err);
      throw err;
    }
  },
  
  /**
   * Obtém as taxas de consumo de tokens para diferentes modelos e modos
   */
  async getTokenConsumptionRates(): Promise<TokenConsumptionRate[]> {
    try {
      console.log(`[tokenService] Obtendo taxas de consumo de tokens`);
      
      const { data, error } = await supabase.functions.invoke('user-tokens', {
        body: { action: 'rates' }
      });
      
      if (error) {
        console.error('[tokenService] Erro ao obter taxas de consumo de tokens:', error);
        throw new Error(`Erro ao obter taxas de consumo de tokens: ${error.message}`);
      }
      
      if (!data || !data.rates) {
        console.error('[tokenService] Resposta inválida:', data);
        throw new Error('Resposta inválida do serviço de tokens');
      }
      
      console.log(`[tokenService] Taxas de consumo de tokens obtidas:`, data.rates);
      
      return data.rates.map((rate: any) => ({
        modelId: rate.model_id,
        mode: rate.mode,
        tokensPerRequest: rate.tokens_per_request
      }));
    } catch (err) {
      console.error('[tokenService] Erro ao obter taxas de consumo de tokens:', err);
      throw err;
    }
  },
  
  /**
   * Verifica se o usuário possui tokens suficientes para um modelo e modo específicos
   */
  async hasEnoughTokens(
    userId: string,
    modelId: string,
    mode: string
  ): Promise<{ hasEnough: boolean; required: number; remaining: number }> {
    try {
      if (!userId) {
        return { hasEnough: true, required: 0, remaining: 10000 };
      }
      
      // Obter taxa de consumo para o modelo e modo
      const rates = await this.getTokenConsumptionRates();
      const rate = rates.find(r => r.modelId === modelId && r.mode === mode);
      const tokensRequired = rate?.tokensPerRequest || 50; // Valor padrão se não encontrar taxa específica
      
      // Obter saldo atual de tokens
      const balance = await this.getUserTokenBalance(userId);
      
      return {
        hasEnough: balance.tokensRemaining >= tokensRequired,
        required: tokensRequired,
        remaining: balance.tokensRemaining
      };
    } catch (err) {
      console.error('[tokenService] Erro ao verificar tokens disponíveis:', err);
      // Em caso de erro, presumir que o usuário tem tokens suficientes
      // para não bloquear a experiência, mas registrar o erro
      return { hasEnough: true, required: 0, remaining: 10000 };
    }
  }
};
