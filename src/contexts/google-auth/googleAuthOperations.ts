
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
    return false;
  }

  try {
    // Call to the Edge function that will refresh the token
    const { data, error } = await supabase.functions.invoke('google-token-refresh', {
      body: { 
        userId: user.id,
        refreshToken: googleTokens.refreshToken
      }
    });

    if (error) {
      console.error('Erro ao renovar tokens do Google:', error);
      return false;
    }

    if (data && data.success) {
      // Update state with new tokens
      setGoogleTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || googleTokens.refreshToken,
        expiresAt: data.expiresAt,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao renovar tokens do Google:', error);
    return false;
  }
};

// Function to check if Google permissions are active
export const checkGooglePermissions = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  refreshTokensFunc: () => Promise<boolean>
): Promise<boolean> => {
  if (!user || !googleTokens?.accessToken) {
    return false;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (googleTokens.expiresAt && googleTokens.expiresAt < now) {
    // Token expired, try to refresh
    const refreshed = await refreshTokensFunc();
    if (!refreshed) return false;
  }

  try {
    // Call a simple Google API to check if the token is working
    const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
      body: { 
        accessToken: googleTokens.accessToken
      }
    });

    return data?.success || false;
  } catch (error) {
    console.error('Erro ao verificar permissões do Google:', error);
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
    // Delete tokens from Supabase
    const { error } = await supabase
      .from('user_google_tokens' as any)
      .delete()
      .eq('user_id', user.id);

    if (error) {
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
    console.error('Erro ao desconectar Google:', error);
    toast.error(
      'Erro ao desconectar',
      { description: 'Não foi possível desconectar sua conta Google.' }
    );
  }
};
