import { supabase } from '@/integrations/supabase/client';
import { tokenEvents } from '@/components/TokenDisplay';

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

interface TokenCache {
  balance: TokenBalance | null;
  rates: TokenConsumptionRate[] | null;
  balanceTimestamp: number;
  ratesTimestamp: number;
}

// Cache expiration times in milliseconds
const BALANCE_CACHE_TTL = 10 * 1000; // 10 seconds (reduced from 2 minutes)
const RATES_CACHE_TTL = 60 * 60 * 1000;  // 1 hour

// In-memory cache
const cache: TokenCache = {
  balance: null,
  rates: null,
  balanceTimestamp: 0,
  ratesTimestamp: 0
};

/**
 * Token management service
 */
export const tokenService = {
  /**
   * Get the user's token balance
   */
  async getUserTokenBalance(userId?: string): Promise<TokenBalance> {
    try {
      // If no userId, return default values
      if (!userId) {
        console.log('[tokenService] No user ID, returning default values');
        return {
          tokensRemaining: 10000,
          tokensUsed: 0,
          nextResetDate: null
        };
      }
      
      // Check cache first
      const now = Date.now();
      if (cache.balance && now - cache.balanceTimestamp < BALANCE_CACHE_TTL) {
        console.log('[tokenService] Returning cached token balance');
        return cache.balance;
      }
      
      console.log(`[tokenService] Getting token balance for user ${userId}`);
      
      const { data, error } = await supabase.functions.invoke('user-tokens', {
        body: { action: 'balance' },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (error) {
        console.error('[tokenService] Error getting token balance:', error);
        throw new Error(`Error getting token balance: ${error.message}`);
      }
      
      if (!data) {
        console.error('[tokenService] Invalid response:', data);
        throw new Error('Invalid response from token service');
      }
      
      // Check if tokens were consolidated (multiple records cleaned up)
      if (data.consolidated) {
        console.log('[tokenService] Token records were consolidated');
        // Clear the cache to ensure fresh data
        this.clearBalanceCache();
      }
      
      if (!data.tokens) {
        console.error('[tokenService] No token data in response:', data);
        return {
          tokensRemaining: 0,
          tokensUsed: 0,
          nextResetDate: null
        };
      }
      
      const balance = {
        tokensRemaining: data.tokens.tokens_remaining || 0,
        tokensUsed: data.tokens.tokens_used || 0,
        nextResetDate: data.tokens.next_reset_date || null
      };
      
      // Update cache
      cache.balance = balance;
      cache.balanceTimestamp = now;
      
      console.log(`[tokenService] Token balance:`, balance);
      return balance;
    } catch (err) {
      console.error('[tokenService] Error getting token balance:', err);
      // Return a default object instead of throwing to avoid breaking the UI
      return {
        tokensRemaining: 0,
        tokensUsed: 0,
        nextResetDate: null
      };
    }
  },
  
  /**
   * Clear the token balance cache to force a fresh fetch
   */
  clearBalanceCache() {
    cache.balance = null;
    cache.balanceTimestamp = 0;
    console.log('[tokenService] Token balance cache cleared');
  },
  
  /**
   * Get token consumption rates for different models and modes
   */
  async getTokenConsumptionRates(): Promise<TokenConsumptionRate[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (cache.rates && now - cache.ratesTimestamp < RATES_CACHE_TTL) {
        console.log('[tokenService] Returning cached token consumption rates');
        return cache.rates;
      }
      
      console.log(`[tokenService] Getting token consumption rates`);
      
      const { data, error } = await supabase.functions.invoke('user-tokens', {
        body: { action: 'rates' }
      });
      
      if (error) {
        console.error('[tokenService] Error getting token rates:', error);
        throw new Error(`Error getting token consumption rates: ${error.message}`);
      }
      
      if (!data || !data.rates) {
        console.error('[tokenService] Invalid response:', data);
        throw new Error('Invalid response from token service');
      }
      
      const rates = data.rates.map((rate: any) => ({
        modelId: rate.model_id,
        mode: rate.mode,
        tokensPerRequest: rate.tokens_per_request
      }));
      
      // Update cache
      cache.rates = rates;
      cache.ratesTimestamp = now;
      
      console.log(`[tokenService] Token consumption rates:`, rates);
      return rates;
    } catch (err) {
      console.error('[tokenService] Error getting token consumption rates:', err);
      throw err;
    }
  },
  
  /**
   * Check if the user has enough tokens for a specific model and mode
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
      
      // Get token consumption rate for the model and mode
      const rates = await this.getTokenConsumptionRates();
      const rate = rates.find(r => r.modelId === modelId && r.mode === mode);
      const tokensRequired = rate?.tokensPerRequest || 50; // Default if no specific rate found
      
      // Get current token balance - force fresh fetch by clearing cache
      this.clearBalanceCache();
      const balance = await this.getUserTokenBalance(userId);
      
      const result = {
        hasEnough: balance.tokensRemaining >= tokensRequired,
        required: tokensRequired,
        remaining: balance.tokensRemaining
      };
      
      if (!result.hasEnough) {
        console.warn(`[tokenService] Not enough tokens: needed ${tokensRequired}, has ${balance.tokensRemaining}`);
      }
      
      return result;
    } catch (err) {
      console.error('[tokenService] Error checking available tokens:', err);
      // In case of error, presume user has enough tokens
      // to avoid blocking the experience, but log the error
      return { hasEnough: true, required: 0, remaining: 10000 };
    }
  },
  
  /**
   * Consume tokens after a successful operation
   */
  async consumeTokens(
    userId: string,
    modelId: string,
    mode: string
  ): Promise<{ success: boolean }> {
    try {
      if (!userId) {
        return { success: true }; // No user, no token consumption
      }
      
      console.log(`[tokenService] Consuming tokens for user ${userId}, model ${modelId}, mode ${mode}`);
      
      // Clear the cache before making the request to ensure we get fresh data
      this.clearBalanceCache();
      
      const { data, error } = await supabase.functions.invoke('user-tokens', {
        body: {
          action: 'consume',
          model_id: modelId,
          mode: mode
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (error) {
        console.error('[tokenService] Error consuming tokens:', error);
        throw error;
      }
      
      // Trigger a token update event for real-time UI updates
      tokenEvents.triggerRefresh();
      
      console.log('[tokenService] Tokens consumed successfully:', data);
      
      // After a short delay, trigger another refresh to ensure UI is updated
      setTimeout(() => {
        console.log('[tokenService] Triggering delayed token refresh after consumption');
        this.clearBalanceCache();
        tokenEvents.triggerRefresh();
      }, 500);
      
      return { success: true };
    } catch (err) {
      console.error('[tokenService] Error consuming tokens:', err);
      return { success: false };
    }
  },
  
  /**
   * Calculate days until next token reset
   */
  getDaysUntilReset(nextResetDate: string | null): number | null {
    if (!nextResetDate) return null;
    
    try {
      const now = new Date();
      const reset = new Date(nextResetDate);
      const diffTime = reset.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (err) {
      console.error('[tokenService] Error calculating days until reset:', err);
      return null;
    }
  }
};
