
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleTokens } from './google-auth/useGoogleTokens';
import { 
  refreshGoogleTokens as refreshGoogleTokensOperation,
  checkGooglePermissions as checkGooglePermissionsOperation,
  disconnectGoogle as disconnectGoogleOperation
} from './google-auth/googleAuthOperations';
import { GoogleAuthContextType } from './google-auth/types';

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user } = useAuth();
  const { 
    googleTokens, 
    setGoogleTokens,
    isGoogleConnected, 
    setIsGoogleConnected,
    loading, 
    fetchGoogleTokens 
  } = useGoogleTokens();

  // Update tokens when session changes
  useEffect(() => {
    if (session) {
      console.log('Session changed, fetching Google tokens');
      fetchGoogleTokens(session);
    }
  }, [session]);

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
          // Check if session exists
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await fetchGoogleTokens(data.session);
            
            // Notify user if Google connected successfully
            if (isGoogleConnected) {
              toast.success(
                'Google connected successfully!',
                { description: 'Your Google account has been connected.' }
              );
            }
          }
        }, 1500);
      }
    };

    checkAuthRedirect();
  }, []);

  // Function to refresh Google tokens (wrap the operation)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    return await refreshGoogleTokensOperation(
      user, 
      googleTokens, 
      setGoogleTokens
    );
  };

  // Function to check Google permissions (wrap the operation)
  const checkGooglePermissions = async (): Promise<boolean> => {
    return await checkGooglePermissionsOperation(
      user, 
      googleTokens, 
      refreshGoogleTokens
    );
  };

  // Function to disconnect Google (wrap the operation)
  const disconnectGoogle = async (): Promise<void> => {
    await disconnectGoogleOperation(
      user, 
      setGoogleTokens, 
      setIsGoogleConnected
    );
  };

  // Debug logging to help diagnose issues
  useEffect(() => {
    console.log('Google Auth State:', { 
      isConnected: isGoogleConnected, 
      hasTokens: !!googleTokens,
      loading
    });
  }, [isGoogleConnected, googleTokens, loading]);

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
