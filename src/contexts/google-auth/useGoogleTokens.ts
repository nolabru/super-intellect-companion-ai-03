
import { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number>(0);

  // Fetch Google tokens from Supabase with improved error handling
  const fetchGoogleTokens = useCallback(async (session: Session | null) => {
    if (!session || !session.user) {
      console.log('No session or user, clearing Google tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching Google tokens for user:', session.user.id);
      
      // Use a direct table query with proper typing
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching Google tokens:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      } else if (data) {
        console.log('Google tokens found:', { 
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
      } else {
        console.log('No Google tokens found for user');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      }
    } catch (error) {
      console.error('Error fetching Google tokens:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } finally {
      setLoading(false);
      setLastChecked(Date.now());
    }
  }, []);

  // Adicionar uma verificação periódica para atualização dos tokens
  useEffect(() => {
    const checkTokensInterval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Se passou mais de 30 segundos desde a última verificação, verificar novamente
        if (Date.now() - lastChecked > 30000) {
          console.log('Periodicalmente verificando tokens do Google...');
          fetchGoogleTokens(data.session);
        }
      }
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(checkTokensInterval);
  }, [fetchGoogleTokens, lastChecked]);

  // Função para forçar uma nova verificação dos tokens
  const refreshTokensState = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await fetchGoogleTokens(data.session);
  }, [fetchGoogleTokens]);

  return {
    googleTokens,
    setGoogleTokens,
    isGoogleConnected,
    setIsGoogleConnected,
    loading,
    setLoading,
    fetchGoogleTokens,
    refreshTokensState
  };
};
