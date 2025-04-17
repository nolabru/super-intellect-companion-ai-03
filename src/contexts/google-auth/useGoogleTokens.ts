
import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
    }
  }, []);

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
