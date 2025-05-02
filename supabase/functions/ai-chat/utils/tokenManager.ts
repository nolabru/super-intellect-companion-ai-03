
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get default token consumption for a model and mode
 * @param modelId The model ID
 * @param mode The generation mode (text, image, video, audio)
 * @returns Token consumption
 */
function getDefaultTokenConsumption(modelId: string, mode: string): number {
  // Default token consumption based on model and mode
  const defaultRates: Record<string, Record<string, number>> = {
    "gpt-3.5-turbo": {
      "text": 5,
      "image": 10
    },
    "gpt-4": {
      "text": 25,
      "image": 50
    },
    "gpt-4o": {
      "text": 25,
      "image": 50
    },
    "gpt-4o-mini": {
      "text": 10,
      "image": 20
    },
    "claude-3-opus": {
      "text": 30
    },
    "claude-3-sonnet": {
      "text": 15
    },
    "claude-3-haiku": {
      "text": 8
    },
    "dall-e-3": {
      "image": 120
    },
    "sdxl": {
      "image": 50
    },
    "midjourney": {
      "image": 100
    }
  };

  // First check exact model match
  if (defaultRates[modelId] && defaultRates[modelId][mode]) {
    return defaultRates[modelId][mode];
  }

  // For models not explicitly defined, use these defaults
  const fallbackRates: Record<string, number> = {
    "text": 10,
    "image": 50,
    "video": 150,
    "audio": 30
  };

  return fallbackRates[mode] || 10;
}

/**
 * Check if a user has enough tokens for an operation
 * @param userId The user ID
 * @param modelId The model ID
 * @param mode The generation mode
 * @returns Object with token information
 */
export async function checkUserTokens(
  userId: string, 
  modelId: string, 
  mode: string
): Promise<{
  hasEnoughTokens: boolean,
  tokensRequired: number,
  tokensRemaining: number,
  error?: string
}> {
  try {
    // Get token consumption for the model and mode
    let tokensRequired: number;
    
    // Try to get from database first
    const { data: rateData, error: rateError } = await supabase
      .from('token_consumption_rates')
      .select('tokens_per_request')
      .eq('model_id', modelId)
      .eq('mode', mode)
      .single();
    
    if (rateError || !rateData) {
      tokensRequired = getDefaultTokenConsumption(modelId, mode);
      console.log(`[tokenManager] Using default token consumption: ${tokensRequired} for ${modelId}/${mode}`);
    } else {
      tokensRequired = rateData.tokens_per_request;
      console.log(`[tokenManager] Using database token consumption: ${tokensRequired} for ${modelId}/${mode}`);
    }
    
    // Get user's token balance
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('tokens_remaining')
      .eq('user_id', userId)
      .single();
    
    // If no user record exists, create one with default balance
    if (userError || !userData) {
      // Default token amount for new users
      const defaultTokens = 1000;
      
      // Insert new record
      const { data: newUserData, error: insertError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          tokens_remaining: defaultTokens,
          tokens_used: 0
        })
        .select('tokens_remaining')
        .single();
      
      if (insertError || !newUserData) {
        console.error(`[tokenManager] Error creating user token record: ${insertError?.message}`);
        return {
          hasEnoughTokens: false,
          tokensRequired,
          tokensRemaining: 0,
          error: "Failed to check token balance"
        };
      }
      
      const tokensRemaining = newUserData.tokens_remaining;
      return {
        hasEnoughTokens: tokensRemaining >= tokensRequired,
        tokensRequired,
        tokensRemaining
      };
    }
    
    const tokensRemaining = userData.tokens_remaining;
    
    // Check if enough tokens and update balance if sufficient
    if (tokensRemaining >= tokensRequired) {
      // Update token balance
      const { error: updateError } = await supabase
        .from('user_tokens')
        .update({
          tokens_remaining: tokensRemaining - tokensRequired,
          tokens_used: supabase.rpc('increment_counter', { 
            row_id: userId, 
            increment_amount: tokensRequired
          }),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error(`[tokenManager] Error updating token balance: ${updateError.message}`);
        return {
          hasEnoughTokens: true, // Still return true as they have enough tokens
          tokensRequired,
          tokensRemaining,
          error: "Failed to update token balance"
        };
      }
    }
    
    return {
      hasEnoughTokens: tokensRemaining >= tokensRequired,
      tokensRequired,
      tokensRemaining
    };
  } catch (error) {
    console.error(`[tokenManager] Error checking tokens: ${error instanceof Error ? error.message : String(error)}`);
    return {
      hasEnoughTokens: false,
      tokensRequired: 0,
      tokensRemaining: 0,
      error: `Failed to check tokens: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
