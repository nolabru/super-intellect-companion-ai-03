
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  GoogleAuthContextType,
  GoogleConnectionState,
  GoogleTokens,
  GOOGLE_SCOPES
} from './google-auth/types-simplified';

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<GoogleConnectionState>(
    GoogleConnectionState.DISCONNECTED
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Initial setup when component mounts
  useEffect(() => {
    console.log('[GoogleAuthContext] Initialization with user:', !!user);
    
    if (user) {
      fetchGoogleTokens();
    } else {
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      setLoading(false);
    }
  }, [user]);

  // Check for OAuth redirect on component mount
  useEffect(() => {
    checkAuthRedirect();
  }, []);

  const checkAuthRedirect = () => {
    // Check URL parameters for OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    
    if ((urlParams.has('provider') && urlParams.get('provider') === 'google') || 
        hashParams.has('access_token')) {
      console.log('[GoogleAuthContext] Detected OAuth redirect from Google');
      
      // Give time for Supabase to process the login
      setTimeout(() => {
        if (user) {
          fetchGoogleTokens();
          toast.success('Google account connected successfully');
        }
      }, 2000);
    }
  };

  const fetchGoogleTokens = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('[GoogleAuthContext] Fetching Google tokens for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('[GoogleAuthContext] Error fetching tokens:', error.message);
        setConnectionState(GoogleConnectionState.DISCONNECTED);
        setIsGoogleConnected(false);
        return;
      }
      
      if (!data) {
        console.log('[GoogleAuthContext] No tokens found');
        setConnectionState(GoogleConnectionState.DISCONNECTED);
        setIsGoogleConnected(false);
        return;
      }
      
      const tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at
      };
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = now >= data.expires_at;
      
      setGoogleTokens(tokens);
      setIsGoogleConnected(!isExpired);
      setConnectionState(
        isExpired ? GoogleConnectionState.DISCONNECTED : GoogleConnectionState.CONNECTED
      );
      
      console.log('[GoogleAuthContext] Tokens found, expired?', isExpired);
    } catch (err) {
      console.error('[GoogleAuthContext] Error fetching Google tokens:', err);
      setConnectionState(GoogleConnectionState.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const refreshGoogleTokens = async (): Promise<boolean> => {
    if (!user || !googleTokens?.refreshToken) {
      console.log('[GoogleAuthContext] User or refresh token not available');
      return false;
    }
    
    try {
      console.log('[GoogleAuthContext] Refreshing Google tokens');
      setConnectionState(GoogleConnectionState.CONNECTING);
      
      const { data, error } = await supabase.functions.invoke('google-token-refresh', {
        body: { 
          userId: user.id,
          refreshToken: googleTokens.refreshToken
        }
      });
      
      if (error || !data.success) {
        console.error('[GoogleAuthContext] Error refreshing tokens:', error || data.error);
        setConnectionState(GoogleConnectionState.ERROR);
        return false;
      }
      
      // Update tokens in state
      const newTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || googleTokens.refreshToken,
        expiresAt: data.expiresAt
      };
      
      setGoogleTokens(newTokens);
      setIsGoogleConnected(true);
      setConnectionState(GoogleConnectionState.CONNECTED);
      
      console.log('[GoogleAuthContext] Tokens refreshed successfully');
      return true;
    } catch (err) {
      console.error('[GoogleAuthContext] Error refreshing tokens:', err);
      setConnectionState(GoogleConnectionState.ERROR);
      return false;
    }
  };

  const disconnectGoogle = async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('[GoogleAuthContext] Disconnecting Google account');
      
      const { error } = await supabase
        .from('user_google_tokens')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[GoogleAuthContext] Error removing tokens:', error);
        throw error;
      }
      
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
      
      toast.success('Google account disconnected');
      console.log('[GoogleAuthContext] Google account disconnected successfully');
    } catch (err) {
      console.error('[GoogleAuthContext] Error disconnecting Google account:', err);
      setConnectionState(GoogleConnectionState.ERROR);
    }
  };

  return (
    <GoogleAuthContext.Provider 
      value={{ 
        googleTokens, 
        isGoogleConnected, 
        loading,
        connectionState,
        refreshGoogleTokens,
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
