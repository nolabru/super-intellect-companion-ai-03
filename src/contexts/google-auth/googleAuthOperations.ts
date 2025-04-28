
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, GoogleConnectionState } from './types';

export async function checkGooglePermissions(
  user: User | null, 
  googleTokens: GoogleTokens | null,
  refreshGoogleTokens: () => Promise<boolean>,
  setConnectionState: (state: GoogleConnectionState) => void
): Promise<boolean> {
  if (!user || !googleTokens) {
    console.log('[checkGooglePermissions] Usuário ou tokens não disponíveis');
    setConnectionState(GoogleConnectionState.DISCONNECTED);
    return false;
  }
  
  try {
    console.log('[checkGooglePermissions] Verificando permissões do Google');
    setConnectionState(GoogleConnectionState.CONNECTING);
    
    const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
      body: { userId: user.id }
    });
    
    if (error) {
      console.error('[checkGooglePermissions] Erro ao verificar permissões:', error);
      setConnectionState(GoogleConnectionState.ERROR);
      return false;
    }
    
    if (data.needsRefresh) {
      console.log('[checkGooglePermissions] Tokens expirados, tentando atualizar');
      const refreshResult = await refreshGoogleTokens();
      
      if (!refreshResult) {
        console.error('[checkGooglePermissions] Falha ao atualizar tokens');
        setConnectionState(GoogleConnectionState.DISCONNECTED);
        return false;
      }
      
      // Verificar permissões novamente após atualizar tokens
      return await checkGooglePermissions(
        user, 
        googleTokens, 
        refreshGoogleTokens,
        setConnectionState
      );
    }
    
    if (!data.success) {
      console.error('[checkGooglePermissions] Permissões não verificadas:', data.error);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      return false;
    }
    
    console.log('[checkGooglePermissions] Permissões verificadas com sucesso');
    setConnectionState(GoogleConnectionState.CONNECTED);
    return true;
  } catch (err) {
    console.error('[checkGooglePermissions] Erro ao verificar permissões:', err);
    setConnectionState(GoogleConnectionState.ERROR);
    return false;
  }
}

export async function refreshGoogleTokens(
  user: User | null, 
  googleTokens: GoogleTokens | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setConnectionState: (state: GoogleConnectionState) => void
): Promise<boolean> {
  if (!user || !googleTokens?.refreshToken) {
    console.log('[refreshGoogleTokens] Usuário ou refresh token não disponíveis');
    return false;
  }
  
  try {
    console.log('[refreshGoogleTokens] Atualizando tokens do Google');
    setConnectionState(GoogleConnectionState.CONNECTING);
    
    const { data, error } = await supabase.functions.invoke('google-token-refresh', {
      body: { 
        userId: user.id,
        refreshToken: googleTokens.refreshToken
      }
    });
    
    if (error || !data.success) {
      console.error('[refreshGoogleTokens] Erro ao atualizar tokens:', error || data.error);
      setConnectionState(GoogleConnectionState.ERROR);
      return false;
    }
    
    // Atualizar tokens no estado
    setGoogleTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || googleTokens.refreshToken,
      expiresAt: data.expiresAt
    });
    
    console.log('[refreshGoogleTokens] Tokens atualizados com sucesso');
    setConnectionState(GoogleConnectionState.CONNECTED);
    return true;
  } catch (err) {
    console.error('[refreshGoogleTokens] Erro ao atualizar tokens:', err);
    setConnectionState(GoogleConnectionState.ERROR);
    return false;
  }
}

export async function disconnectGoogle(
  user: User | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setIsGoogleConnected: (isConnected: boolean) => void,
  setConnectionState: (state: GoogleConnectionState) => void
): Promise<void> {
  if (!user) {
    console.log('[disconnectGoogle] Usuário não disponível');
    return;
  }
  
  try {
    console.log('[disconnectGoogle] Desconectando conta Google');
    
    // Remover tokens da base de dados
    const { error } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[disconnectGoogle] Erro ao remover tokens:', error);
      throw error;
    }
    
    // Atualizar estado local
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setConnectionState(GoogleConnectionState.DISCONNECTED);
    
    console.log('[disconnectGoogle] Conta Google desconectada com sucesso');
  } catch (err) {
    console.error('[disconnectGoogle] Erro ao desconectar conta Google:', err);
    setConnectionState(GoogleConnectionState.ERROR);
  }
}
