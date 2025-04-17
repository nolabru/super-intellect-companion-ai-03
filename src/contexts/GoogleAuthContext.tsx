
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

type GoogleAuthContextType = {
  googleTokens: GoogleTokens | null;
  isGoogleConnected: boolean;
  loading: boolean;
  refreshGoogleTokens: () => Promise<boolean>;
  checkGooglePermissions: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
};

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Google tokens when user state changes
  useEffect(() => {
    const fetchGoogleTokens = async () => {
      if (!user) {
        setGoogleTokens(null);
        setIsGoogleConnected(false);
        setLoading(false);
        return;
      }

      try {
        // Use the generic Supabase functions to avoid typing issues
        const { data, error } = await supabase
          .from('user_google_tokens' as any)
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching Google tokens:', error);
          setGoogleTokens(null);
          setIsGoogleConnected(false);
        } else if (data && data.length > 0) {
          // Force type casting since TypeScript doesn't know about this table
          const tokenData = data[0];
          setGoogleTokens({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_at,
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

    if (!authLoading) {
      fetchGoogleTokens();
    }
  }, [user, authLoading]);

  // Function to refresh Google tokens
  const refreshGoogleTokens = async (): Promise<boolean> => {
    if (!user || !googleTokens?.refreshToken) {
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-token-refresh', {
        body: { 
          userId: user.id,
          refreshToken: googleTokens.refreshToken
        }
      });

      if (error) {
        console.error('Error refreshing Google tokens:', error);
        return false;
      }

      if (data && data.success) {
        setGoogleTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || googleTokens.refreshToken,
          expiresAt: data.expiresAt,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing Google tokens:', error);
      return false;
    }
  };

  // Function to check if Google permissions are active
  const checkGooglePermissions = async (): Promise<boolean> => {
    if (!user || !googleTokens?.accessToken) {
      return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (googleTokens.expiresAt && googleTokens.expiresAt < now) {
      // Token expired, try to refresh
      const refreshed = await refreshGoogleTokens();
      if (!refreshed) return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
        body: { 
          accessToken: googleTokens.accessToken
        }
      });

      return data?.success || false;
    } catch (error) {
      console.error('Error verifying Google permissions:', error);
      return false;
    }
  };

  // Function to disconnect Google account
  const disconnectGoogle = async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_google_tokens' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      throw error;
    }
  };

  return (
    <GoogleAuthContext.Provider 
      value={{ 
        googleTokens, 
        isGoogleConnected, 
        loading, 
        refreshGoogleTokens,
        checkGooglePermissions,
        disconnectGoogle
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};
