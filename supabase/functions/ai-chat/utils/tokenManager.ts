
// Token manager utility for AI Chat
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

// Initialize the Supabase client for the edge function
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TokenInfo {
  hasEnoughTokens: boolean;
  tokensRequired: number;
  tokensRemaining?: number;
  error?: string;
}

/**
 * Check if a user has enough tokens for an operation
 */
export async function checkUserTokens(
  userId: string | undefined,
  modelId: string,
  mode: string
): Promise<TokenInfo> {
  try {
    // If no user ID, return successful response (for unauthenticated preview/testing)
    if (!userId) {
      console.log('No user ID provided, skipping token check');
      return { 
        hasEnoughTokens: true, 
        tokensRequired: 0,
        tokensRemaining: 10000
      };
    }

    console.log(`Checking tokens for user ${userId}, model ${modelId}, mode ${mode}`);
    
    // Get token consumption for the requested operation
    const { data: rateData, error: rateError } = await supabase
      .from('token_consumption_rates')
      .select('tokens_per_request')
      .eq('model_id', modelId)
      .eq('mode', mode)
      .single();
    
    if (rateError && rateError.code !== 'PGRST116') {
      console.error('Error fetching token rate:', rateError);
      return { 
        hasEnoughTokens: false, 
        tokensRequired: 0,
        error: 'Error calculating token consumption' 
      };
    }
    
    // Use default consumption if specific rate not found
    const tokensRequired = rateData?.tokens_per_request || 50;
    console.log(`Operation requires ${tokensRequired} tokens`);
    
    // Check if token balance is sufficient using the database function
    const { data: result, error: fnError } = await supabase.rpc(
      'check_and_update_token_balance',
      {
        p_user_id: userId,
        p_model_id: modelId,
        p_mode: mode
      }
    );
    
    if (fnError) {
      console.error('Error checking token balance:', fnError);
      return {
        hasEnoughTokens: false,
        tokensRequired,
        error: 'Error verifying token balance'
      };
    }
    
    // Get updated token balance to return to client
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('tokens_remaining, next_reset_date')
      .eq('user_id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user token balance:', userError);
    }
    
    const tokensRemaining = userData?.tokens_remaining || 0;
    
    // If result is true, user has enough tokens and they've already been deducted
    if (result === true) {
      console.log(`User has enough tokens. Remaining: ${tokensRemaining}`);
      return {
        hasEnoughTokens: true,
        tokensRequired,
        tokensRemaining
      };
    } else {
      console.log(`User doesn't have enough tokens. Required: ${tokensRequired}, Remaining: ${tokensRemaining}`);
      return {
        hasEnoughTokens: false,
        tokensRequired,
        tokensRemaining,
        error: `Not enough tokens. This operation requires ${tokensRequired} tokens.`
      };
    }
  } catch (err) {
    console.error('Unexpected error in token check:', err);
    return {
      hasEnoughTokens: false,
      tokensRequired: 0,
      error: 'Unexpected error checking token balance'
    };
  }
}

/**
 * Get user's current token balance
 */
export async function getUserTokenBalance(userId: string | undefined): Promise<{
  tokensRemaining: number;
  tokensUsed: number;
  nextResetDate: string | null;
  error?: string;
}> {
  try {
    // If no user ID, return default values
    if (!userId) {
      return { 
        tokensRemaining: 10000, 
        tokensUsed: 0,
        nextResetDate: null
      };
    }
    
    const { data, error } = await supabase
      .from('user_tokens')
      .select('tokens_remaining, tokens_used, next_reset_date')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user token balance:', error);
      return {
        tokensRemaining: 0,
        tokensUsed: 0,
        nextResetDate: null,
        error: 'Error fetching token balance'
      };
    }
    
    return {
      tokensRemaining: data.tokens_remaining,
      tokensUsed: data.tokens_used,
      nextResetDate: data.next_reset_date
    };
  } catch (err) {
    console.error('Unexpected error getting token balance:', err);
    return {
      tokensRemaining: 0,
      tokensUsed: 0,
      nextResetDate: null,
      error: 'Unexpected error getting token balance'
    };
  }
}

/**
 * Get token consumption rates for all model/mode combinations
 */
export async function getTokenConsumptionRates() {
  try {
    const { data, error } = await supabase
      .from('token_consumption_rates')
      .select('model_id, mode, tokens_per_request')
      .order('tokens_per_request', { ascending: false });
    
    if (error) {
      console.error('Error fetching token consumption rates:', error);
      return { rates: [], error: 'Error fetching token consumption rates' };
    }
    
    return { rates: data || [] };
  } catch (err) {
    console.error('Unexpected error getting token rates:', err);
    return { rates: [], error: 'Unexpected error getting token rates' };
  }
}
