
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, GoogleConnectionState } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<GoogleConnectionState>(GoogleConnectionState.DISCONNECTED);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number>(0);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Limpar intervalo na desmontagem
  useEffect(() => {
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  // Buscar tokens Google do Supabase com melhor tratamento de erros
  const fetchGoogleTokens = useCallback(async (userId: string) => {
    if (!userId) {
      console.log('[useGoogleTokens] Sem ID de usuário, limpando tokens Google');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      setLoading(false);
      return;
    }

    setLoading(true);
    setConnectionState(GoogleConnectionState.CONNECTING);
    
    try {
      console.log('[useGoogleTokens] Buscando tokens Google para usuário:', userId);
      
      // Usar uma consulta direta à tabela
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Usando maybeSingle em vez de single para evitar erros quando não há dados
      
      if (error) {
        console.error('[useGoogleTokens] Erro ao buscar tokens Google:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setConnectionState(GoogleConnectionState.ERROR);
      } else if (data) {
        console.log('[useGoogleTokens] Tokens Google encontrados:', { 
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token,
          expiresAt: data.expires_at
        });
        
        setGoogleTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
        });
        setIsGoogleConnected(true);
        setConnectionState(GoogleConnectionState.CONNECTED);
      } else {
        console.log('[useGoogleTokens] Nenhum token Google encontrado para o usuário');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setConnectionState(GoogleConnectionState.DISCONNECTED);
      }
    } catch (error) {
      console.error('[useGoogleTokens] Erro ao buscar tokens Google:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.ERROR);
    } finally {
      setLoading(false);
      setLastChecked(Date.now());
    }
  }, []);

  // Configurar verificação periódica de tokens
  const setupTokenChecking = useCallback((userId: string) => {
    // Limpar qualquer intervalo existente
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }
    
    // Configurar intervalo apenas se tivermos um ID de usuário
    if (userId) {
      tokenCheckInterval.current = setInterval(async () => {
        // Verificar apenas se passaram mais de 30 segundos desde a última verificação
        if (Date.now() - lastChecked > 30000) {
          console.log('[useGoogleTokens] Verificando tokens Google periodicamente...');
          await fetchGoogleTokens(userId);
        }
      }, 60000); // Verificar a cada minuto
    }
  }, [fetchGoogleTokens, lastChecked]);

  // Função para forçar uma verificação de token
  const refreshTokensState = useCallback(async () => {
    console.log('[useGoogleTokens] Forçando atualização do estado do token');
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await fetchGoogleTokens(data.session.user.id);
    }
  }, [fetchGoogleTokens]);

  return {
    googleTokens,
    setGoogleTokens,
    isGoogleConnected,
    setIsGoogleConnected,
    connectionState,
    setConnectionState,
    loading,
    setLoading,
    fetchGoogleTokens,
    refreshTokensState,
    setupTokenChecking
  };
};
