
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
    console.log('Cannot refresh tokens: missing user or refresh token');
    return false;
  }

  try {
    console.log('Refreshing Google tokens...');
    // Call to the Edge function that will refresh the token
    const { data, error } = await supabase.functions.invoke('google-token-refresh', {
      body: { 
        userId: user.id,
        refreshToken: googleTokens.refreshToken
      }
    });

    if (error) {
      console.error('Error refreshing Google tokens:', error);
      return false;
    }

    console.log('Refresh token response:', data);

    if (data && data.success) {
      console.log('Google tokens refreshed successfully');
      // Update state with new tokens
      setGoogleTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || googleTokens.refreshToken,
        expiresAt: data.expiresAt,
      });
      return true;
    }

    console.log('Failed to refresh tokens:', data);
    return false;
  } catch (error) {
    console.error('Exception refreshing Google tokens:', error);
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
    console.log('No user found for Google permission check');
    return false;
  }
  
  if (!googleTokens?.accessToken) {
    console.log('No Google tokens found for permission check');
    return false;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  console.log(`Current time: ${now}, Token expires at: ${googleTokens.expiresAt}`);
  
  if (googleTokens.expiresAt && googleTokens.expiresAt < now) {
    console.log('Google token expired, attempting to refresh');
    // Token expired, try to refresh
    const refreshed = await refreshTokensFunc();
    if (!refreshed) {
      console.log('Failed to refresh expired token');
      return false;
    }
    console.log('Token refreshed successfully');
  }

  try {
    console.log('Verifying Google permissions with token');
    // Call a simple Google API to check if the token is working
    const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
      body: { 
        accessToken: googleTokens.accessToken
      }
    });

    if (error) {
      console.error('Error calling permission verification:', error);
      return false;
    }

    console.log('Permission verification response:', data);
    
    // Se a API retornar qualquer resposta bem-sucedida (mesmo que algumas permissões estejam faltando),
    // consideramos que o token é válido
    if (data && data.success) {
      console.log('Google permissions verified successfully');
      return true;
    }
    
    // Se a verificação falhou devido à expiração do token (que a API do Google pode indicar),
    // tente atualizar o token e verificar novamente
    if (data && !data.success && data.error === 'invalid_token') {
      console.log('Token inválido detectado, tentando atualizar...');
      const refreshed = await refreshTokensFunc();
      if (!refreshed) {
        console.log('Falha ao atualizar token inválido');
        return false;
      }
      
      // Tente verificar novamente com o novo token
      const retryResult = await supabase.functions.invoke('google-verify-permissions', {
        body: { 
          accessToken: googleTokens.accessToken 
        }
      });
      
      return retryResult.data?.success || false;
    }
    
    return false;
  } catch (error) {
    console.error('Exception verifying Google permissions:', error);
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
    console.log('Disconnecting Google account...');
    
    // Using direct delete query instead of RPC function
    const { error } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting Google tokens from database:', error);
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
    console.error('Error disconnecting Google:', error);
    toast.error(
      'Erro ao desconectar',
      { description: 'Não foi possível desconectar sua conta Google.' }
    );
  }
};
