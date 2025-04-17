
import { useState, useCallback, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, GoogleConnectionState } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<GoogleConnectionState>(GoogleConnectionState.DISCONNECTED);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number>(0);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  // Fetch Google tokens from Supabase with improved error handling
  const fetchGoogleTokens = useCallback(async (session: Session | null) => {
    if (!session || !session.user) {
      console.log('[useGoogleTokens] No session or user, clearing Google tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      setLoading(false);
      return;
    }

    setLoading(true);
    setConnectionState(GoogleConnectionState.CONNECTING);
    
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
        setConnectionState(GoogleConnectionState.ERROR);
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
        setConnectionState(GoogleConnectionState.CONNECTED);
      } else {
        console.log('[useGoogleTokens] No Google tokens found for user');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setConnectionState(GoogleConnectionState.DISCONNECTED);
      }
    } catch (error) {
      console.error('[useGoogleTokens] Error fetching Google tokens:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.ERROR);
    } finally {
      setLoading(false);
      setLastChecked(Date.now());
    }
  }, []);

  // Set up periodic token checking
  const setupTokenChecking = useCallback((session: Session | null) => {
    // Clear any existing interval
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }
    
    // Only set up interval if we have a session
    if (session) {
      tokenCheckInterval.current = setInterval(async () => {
        // Only check if more than 30 seconds passed since last check
        if (Date.now() - lastChecked > 30000) {
          console.log('[useGoogleTokens] Periodically checking Google tokens...');
          await fetchGoogleTokens(session);
        }
      }, 60000); // Check every minute
    }
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
    connectionState,
    setConnectionState,
    loading,
    setLoading,
    fetchGoogleTokens,
    refreshTokensState,
    setupTokenChecking
  };
};
