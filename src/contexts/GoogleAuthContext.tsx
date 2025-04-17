
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
    fetchGoogleTokens,
    refreshTokensState
  } = useGoogleTokens();

  // Debug logging
  useEffect(() => {
    console.log('[GoogleAuthContext] Initialization with session:', !!session);
  }, []);

  // Update tokens when session changes
  useEffect(() => {
    if (session) {
      console.log('[GoogleAuthContext] Session detected, fetching Google tokens');
      fetchGoogleTokens(session);
    } else {
      console.log('[GoogleAuthContext] No session, clearing Google tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    }
  }, [session, fetchGoogleTokens, setGoogleTokens, setIsGoogleConnected]);

  // Check after Google OAuth login
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Check for URL parameters indicating an authentication redirect
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Check if this is a redirect after OAuth login
      if (urlParams.has('provider') || hashParams.has('access_token')) {
        console.log('[GoogleAuthContext] Processing OAuth redirect');
        
        // Give Supabase time to process the login
        setTimeout(async () => {
          // Check if session exists
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await fetchGoogleTokens(data.session);
            
            // Force another check after a longer delay to ensure tokens are processed
            setTimeout(() => {
              refreshTokensState();
              
              // Notify user based on the updated connection status
              if (isGoogleConnected) {
                toast.success(
                  'Google connected successfully!',
                  { description: 'Your Google account has been connected.' }
                );
              } else {
                console.log('[GoogleAuthContext] Google connection status after delayed check:', isGoogleConnected);
              }
            }, 3000);
          }
        }, 2500);
      }
    };

    checkAuthRedirect();
  }, [fetchGoogleTokens, isGoogleConnected, refreshTokensState]);

  // Function to refresh Google tokens (wrap the operation)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    console.log('[GoogleAuthContext] Attempting to refresh Google tokens');
    const result = await refreshGoogleTokensOperation(
      user, 
      googleTokens, 
      setGoogleTokens
    );
    
    // Update isGoogleConnected if tokens were refreshed successfully
    if (result) {
      setIsGoogleConnected(true);
      console.log('[GoogleAuthContext] Tokens refreshed successfully, setting connected state');
    } else {
      console.log('[GoogleAuthContext] Token refresh failed');
    }
    
    return result;
  };

  // Function to check Google permissions (wrap the operation)
  const checkGooglePermissions = async (): Promise<boolean> => {
    console.log('[GoogleAuthContext] Checking Google permissions');
    return await checkGooglePermissionsOperation(
      user, 
      googleTokens, 
      refreshGoogleTokens
    );
  };

  // Function to disconnect Google (wrap the operation)
  const disconnectGoogle = async (): Promise<void> => {
    console.log('[GoogleAuthContext] Disconnecting Google account');
    await disconnectGoogleOperation(
      user, 
      setGoogleTokens, 
      setIsGoogleConnected
    );
  };

  // Debug logging to help diagnose issues
  useEffect(() => {
    console.log('[GoogleAuthContext] Auth State:', { 
      isConnected: isGoogleConnected, 
      hasTokens: !!googleTokens,
      loading,
      userLoggedIn: !!user
    });
  }, [isGoogleConnected, googleTokens, loading, user]);

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
