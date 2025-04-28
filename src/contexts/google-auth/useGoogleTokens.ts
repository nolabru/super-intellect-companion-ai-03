
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, GoogleConnectionState } from './types';

export function useGoogleTokens() {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionState, setConnectionState] = useState<GoogleConnectionState>(
    GoogleConnectionState.DISCONNECTED
  );

  const fetchGoogleTokens = useCallback(async (userId: string) => {
    try {
      console.log('[useGoogleTokens] Buscando tokens do Google para o usuário:', userId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('[useGoogleTokens] Erro ao buscar tokens:', error.message);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setConnectionState(GoogleConnectionState.DISCONNECTED);
        return null;
      }
      
      if (!data) {
        console.log('[useGoogleTokens] Nenhum token encontrado');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setConnectionState(GoogleConnectionState.DISCONNECTED);
        return null;
      }
      
      const tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at
      };
      
      const isExpired = Date.now() / 1000 >= data.expires_at;
      
      setGoogleTokens(tokens);
      setIsGoogleConnected(!isExpired);
      setConnectionState(
        isExpired ? GoogleConnectionState.DISCONNECTED : GoogleConnectionState.CONNECTED
      );
      
      console.log('[useGoogleTokens] Tokens encontrados, expirado?', isExpired);
      
      return tokens;
    } catch (err) {
      console.error('[useGoogleTokens] Erro ao buscar tokens do Google:', err);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.ERROR);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const refreshTokensState = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    
    // Se não há tokens, mantenha o estado desconectado
    if (!googleTokens) {
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      return;
    }
    
    // Verificar se os tokens ainda são válidos
    const isExpired = now >= googleTokens.expiresAt;
    
    setIsGoogleConnected(!isExpired);
    setConnectionState(
      isExpired ? GoogleConnectionState.DISCONNECTED : GoogleConnectionState.CONNECTED
    );
    
    console.log('[useGoogleTokens] Estado de tokens atualizado, expirado?', isExpired);
  }, [googleTokens]);
  
  // Configurar verificação periódica de tokens
  const setupTokenChecking = useCallback((userId: string) => {
    // Verificar tokens a cada 5 minutos
    const interval = setInterval(async () => {
      console.log('[useGoogleTokens] Verificação periódica de tokens');
      await fetchGoogleTokens(userId);
    }, 5 * 60 * 1000);
    
    // Limpar intervalo na desmontagem
    return () => clearInterval(interval);
  }, [fetchGoogleTokens]);
  
  // Log de debugging
  useEffect(() => {
    console.log('[useGoogleTokens] Estado atual:', { 
      isConnected: isGoogleConnected, 
      connectionState, 
      hasTokens: !!googleTokens 
    });
  }, [isGoogleConnected, connectionState, googleTokens]);

  return {
    googleTokens,
    setGoogleTokens,
    isGoogleConnected,
    setIsGoogleConnected,
    connectionState,
    setConnectionState,
    loading,
    fetchGoogleTokens,
    refreshTokensState,
    setupTokenChecking
  };
}
