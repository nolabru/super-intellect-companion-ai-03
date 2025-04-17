
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { GoogleTokens } from './types';

// Function to refresh Google tokens (when expired)
export const refreshGoogleTokens = async (
  user: User | null, 
  googleTokens: GoogleTokens | null,
  setGoogleTokens: (tokens: GoogleTokens) => void
): Promise<boolean> => {
  if (!user || !googleTokens?.refreshToken) {
    console.log('[googleAuthOperations] Cannot refresh tokens: missing user or refresh token');
    return false;
  }

  try {
    console.log('[googleAuthOperations] Refreshing Google tokens...');
    // Call to the Edge function that will refresh the token
    const { data, error } = await supabase.functions.invoke('google-token-refresh', {
      body: { 
        userId: user.id,
        refreshToken: googleTokens.refreshToken
      }
    });

    if (error) {
      console.error('[googleAuthOperations] Error refreshing Google tokens:', error);
      return false;
    }

    console.log('[googleAuthOperations] Refresh token response:', data);

    if (data && data.success) {
      console.log('[googleAuthOperations] Google tokens refreshed successfully');
      // Update state with new tokens
      setGoogleTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || googleTokens.refreshToken, // Keep old refresh token if none returned
        expiresAt: data.expiresAt,
      });
      return true;
    }

    console.log('[googleAuthOperations] Failed to refresh tokens:', data);
    return false;
  } catch (error) {
    console.error('[googleAuthOperations] Exception refreshing Google tokens:', error);
    return false;
  }
};

// Function to check if Google permissions are active
export const checkGooglePermissions = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  refreshTokensFunc: () => Promise<boolean>
): Promise<boolean> => {
  if (!user) {
    console.log('[googleAuthOperations] No user found for Google permission check');
    return false;
  }
  
  if (!googleTokens?.accessToken) {
    console.log('[googleAuthOperations] No Google tokens found for permission check');
    return false;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  console.log(`[googleAuthOperations] Current time: ${now}, Token expires at: ${googleTokens.expiresAt}`);
  
  if (googleTokens.expiresAt && googleTokens.expiresAt < now) {
    console.log('[googleAuthOperations] Google token expired, attempting to refresh');
    // Token expired, try to refresh
    const refreshed = await refreshTokensFunc();
    if (!refreshed) {
      console.log('[googleAuthOperations] Failed to refresh expired token');
      return false;
    }
    console.log('[googleAuthOperations] Token refreshed successfully');
  }

  try {
    console.log('[googleAuthOperations] Verifying Google permissions with token');
    // Call a simple Google API to check if the token is working
    const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
      body: { 
        accessToken: googleTokens.accessToken
      }
    });

    if (error) {
      console.error('[googleAuthOperations] Error calling permission verification:', error);
      return false;
    }

    console.log('[googleAuthOperations] Permission verification response:', data);
    
    // If the API returns any successful response (even if some permissions are missing),
    // we consider the token to be valid
    if (data && data.success) {
      console.log('[googleAuthOperations] Google permissions verified successfully');
      return true;
    }
    
    // If the verification failed due to token expiration (which the Google API may indicate),
    // try to refresh the token and verify again
    if (data && !data.success && data.error === 'invalid_token') {
      console.log('[googleAuthOperations] Token inválido detectado, tentando atualizar...');
      const refreshed = await refreshTokensFunc();
      if (!refreshed) {
        console.log('[googleAuthOperations] Falha ao atualizar token inválido');
        return false;
      }
      
      // Try to verify again with the new token
      const retryResult = await supabase.functions.invoke('google-verify-permissions', {
        body: { 
          accessToken: googleTokens.accessToken 
        }
      });
      
      return retryResult.data?.success || false;
    }
    
    return false;
  } catch (error) {
    console.error('[googleAuthOperations] Exception verifying Google permissions:', error);
    return false;
  }
};

// Function to disconnect Google account
export const disconnectGoogle = async (
  user: User | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setIsGoogleConnected: (connected: boolean) => void
): Promise<void> => {
  if (!user) return;

  try {
    console.log('[googleAuthOperations] Disconnecting Google account...');
    
    // Using direct delete query instead of RPC function
    const { error } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('[googleAuthOperations] Error deleting Google tokens from database:', error);
      throw error;
    }

    // Clear local state
    setGoogleTokens(null);
    setIsGoogleConnected(false);

    toast.success(
      'Google desconectado',
      { description: 'Sua conta Google foi desconectada com sucesso.' }
    );
  } catch (error) {
    console.error('[googleAuthOperations] Error disconnecting Google:', error);
    toast.error(
      'Erro ao desconectar',
      { description: 'Não foi possível desconectar sua conta Google.' }
    );
  }
};
