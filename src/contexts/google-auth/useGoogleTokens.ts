
import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, UserGoogleToken } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Google tokens from Supabase
  const fetchGoogleTokens = async (session: Session | null): Promise<void> => {
    if (!session || !session.user) {
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    try {
      console.log(`[useGoogleTokens] Fetching tokens for user: ${session.user.id}`);
      // Use the generic Supabase functions to avoid typing issues
      const { data, error } = await supabase
        .from('user_google_tokens' as any)
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Erro ao buscar tokens do Google:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      } else if (data && data.length > 0) {
        console.log('[useGoogleTokens] Tokens found:', data[0]);
        // Force type casting since TypeScript doesn't know about this table
        const tokenData = data[0] as unknown as UserGoogleToken;
        setGoogleTokens({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
        });
        setIsGoogleConnected(true);
      } else {
        console.log('[useGoogleTokens] No tokens found for user');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      }
    } catch (error) {
      console.error('Erro ao buscar tokens do Google:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    googleTokens,
    setGoogleTokens,
    isGoogleConnected,
    setIsGoogleConnected,
    loading,
    setLoading,
    fetchGoogleTokens,
  };
};
