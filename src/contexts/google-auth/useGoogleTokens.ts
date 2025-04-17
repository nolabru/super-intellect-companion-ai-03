
import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GoogleTokens } from './types';

export const useGoogleTokens = () => {
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Google tokens from Supabase
  const fetchGoogleTokens = async (session: Session | null) => {
    if (!session || !session.user) {
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    try {
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
        setGoogleTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
        });
        setIsGoogleConnected(true);
      } else {
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
