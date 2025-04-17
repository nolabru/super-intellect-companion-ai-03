
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
      console.log('[useGoogleTokens] No session or user, clearing Google tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('[useGoogleTokens] Fetching Google tokens for user:', session.user.id);
      
      // Use a direct table query
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle(); // Using maybeSingle instead of single to avoid errors when no data
      
      if (error) {
        console.error('[useGoogleTokens] Error fetching Google tokens:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      } else if (data) {
        console.log('[useGoogleTokens] Google tokens found:', { 
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
        console.log('[useGoogleTokens] No Google tokens found for user');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      }
    } catch (error) {
      console.error('[useGoogleTokens] Error fetching Google tokens:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } finally {
      setLoading(false);
      setLastChecked(Date.now());
    }
  }, []);

  // Add periodic token check
  useEffect(() => {
    const checkTokensInterval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Check again if more than 30 seconds passed since last check
        if (Date.now() - lastChecked > 30000) {
          console.log('[useGoogleTokens] Periodically checking Google tokens...');
          fetchGoogleTokens(data.session);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkTokensInterval);
  }, [fetchGoogleTokens, lastChecked]);

  // Function to force a token check
  const refreshTokensState = useCallback(async () => {
    console.log('[useGoogleTokens] Forcing token state refresh');
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
