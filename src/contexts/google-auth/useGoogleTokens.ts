
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens, UserGoogleToken } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Fetch Google tokens from Supabase
  const fetchGoogleTokens = useCallback(async (session: Session | null) => {
    if (!session || !session.user) {
      console.log('[useGoogleTokens] No session or user, clearing tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return null;
    }

    try {
      // Avoid multiple rapid calls
      const now = Date.now();
      if (now - lastFetchTime < 1000) {
        console.log('[useGoogleTokens] Throttling fetch calls');
        return googleTokens;
      }
      
      setLastFetchTime(now);
      setLoading(true);

      console.log(`[useGoogleTokens] Fetching Google tokens for user ${session.user.id}`);
      
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('[useGoogleTokens] Error fetching Google tokens:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setLoading(false);
        return null;
      } 
      
      if (data) {
        console.log('[useGoogleTokens] Google tokens found:', data);
        
        // Force type casting since TypeScript doesn't know about this table
        const tokenData = data as unknown as UserGoogleToken;
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        const isExpired = tokenData.expires_at && tokenData.expires_at < now;
        
        if (isExpired) {
          console.log('[useGoogleTokens] Token expired, will need refresh');
        }
        
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
        };
        
        setGoogleTokens(tokens);
        setIsGoogleConnected(true);
        setLoading(false);
        return tokens;
      } else {
        console.log('[useGoogleTokens] No Google tokens found for user');
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setLoading(false);
        return null;
      }
    } catch (error) {
      console.error('[useGoogleTokens] Exception fetching Google tokens:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return null;
    }
  }, [lastFetchTime, googleTokens]);

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
