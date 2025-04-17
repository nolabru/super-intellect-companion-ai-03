
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GoogleTokens } from './contexts/google-auth/types';
import { 
  refreshGoogleTokens as refreshGoogleTokensOperation,
  checkGooglePermissions as checkGooglePermissionsOperation,
  disconnectGoogle as disconnectGoogleOperation 
} from './contexts/google-auth/googleAuthOperations';

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
          .from('user_google_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching Google tokens:', error);
          setGoogleTokens(null);
          setIsGoogleConnected(false);
        } else if (data) {
          // Safe type casting after successful query
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

    if (!authLoading) {
      fetchGoogleTokens();
    }
  }, [user, authLoading]);

  // Function to refresh Google tokens
  const refreshGoogleTokens = async (): Promise<boolean> => {
    return refreshGoogleTokensOperation(user, googleTokens, setGoogleTokens);
  };

  // Function to check if Google permissions are active
  const checkGooglePermissions = async (): Promise<boolean> => {
    return checkGooglePermissionsOperation(user, googleTokens, refreshGoogleTokens);
  };

  // Function to disconnect Google account
  const disconnectGoogle = async (): Promise<void> => {
    await disconnectGoogleOperation(user, setGoogleTokens, setIsGoogleConnected);
  };

  // Check after Google OAuth login
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Check for URL parameters indicating an authentication redirect
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Check if this is a redirect after OAuth login
      if (urlParams.has('provider') || hashParams.has('access_token')) {
        console.log('Processing OAuth redirect');
        
        // Give Supabase time to process the login
        setTimeout(async () => {
          if (user) {
            // Refetch tokens after authentication
            try {
              const { data } = await supabase
                .from('user_google_tokens')
                .select('*')
                .eq('user_id', user.id)
                .single();
                
              if (data) {
                setGoogleTokens({
                  accessToken: data.access_token,
                  refreshToken: data.refresh_token,
                  expiresAt: data.expires_at,
                });
                setIsGoogleConnected(true);
                
                toast.success(
                  'Google connected successfully!',
                  { description: 'Your Google account has been connected.' }
                );
              }
            } catch (error) {
              console.error('Error processing auth redirect:', error);
            }
          }
        }, 1000);
      }
    };

    if (!authLoading && user) {
      checkAuthRedirect();
    }
  }, [user, authLoading]);

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
