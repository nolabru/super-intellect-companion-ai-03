
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleTokens } from './google-auth/useGoogleTokens';
import { 
  refreshGoogleTokens as refreshGoogleTokensOperation,
  checkGooglePermissions as checkGooglePermissionsOperation,
  disconnectGoogle as disconnectGoogleOperation
} from './google-auth/googleAuthOperations';
import { GoogleAuthContextType, GoogleConnectionState } from './google-auth/types';

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user } = useAuth();
  const [oauthRedirectInProgress, setOauthRedirectInProgress] = useState<boolean>(false);
  
  const { 
    googleTokens, 
    setGoogleTokens,
    isGoogleConnected, 
    setIsGoogleConnected,
    connectionState,
    setConnectionState,
    loading, 
    fetchGoogleTokens,
    refreshTokensState,
    setupTokenChecking
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
      setupTokenChecking(session);
    } else {
      console.log('[GoogleAuthContext] No session, clearing Google tokens');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
    }
  }, [session, fetchGoogleTokens, setGoogleTokens, setIsGoogleConnected, setConnectionState, setupTokenChecking]);

  // Check for OAuth redirect parameters only once on component mount
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Check for URL parameters indicating an authentication redirect
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Check if this is a redirect after OAuth login
      if (
        (urlParams.has('provider') && urlParams.get('provider') === 'google') || 
        hashParams.has('access_token')
      ) {
        console.log('[GoogleAuthContext] Detected Google OAuth redirect');
        setOauthRedirectInProgress(true);
        
        // Give Supabase time to process the login
        setTimeout(async () => {
          try {
            // Check if session exists
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              console.log('[GoogleAuthContext] Session found after OAuth redirect, fetching tokens');
              await fetchGoogleTokens(data.session);
              
              // Force another check after a longer delay
              setTimeout(async () => {
                console.log('[GoogleAuthContext] Performing delayed token check');
                await refreshTokensState();
                
                // Notify user based on the updated connection status
                if (isGoogleConnected) {
                  toast.success(
                    'Google connected successfully!',
                    { description: 'Your Google account has been connected.' }
                  );
                } else {
                  console.log('[GoogleAuthContext] Google connection status after delayed check:', isGoogleConnected);
                  await fetchGoogleTokens(data.session);
                  
                  // One final check with an even longer delay
                  setTimeout(async () => {
                    console.log('[GoogleAuthContext] Performing final token check');
                    await refreshTokensState();
                    
                    if (isGoogleConnected) {
                      toast.success(
                        'Google connected successfully!',
                        { description: 'Your Google account has been connected.' }
                      );
                    } else {
                      toast.error(
                        'Failed to connect Google account',
                        { description: 'Please try again or contact support.' }
                      );
                    }
                    
                    setOauthRedirectInProgress(false);
                  }, 5000);
                }
              }, 3000);
            } else {
              console.log('[GoogleAuthContext] No session found after OAuth redirect');
              setOauthRedirectInProgress(false);
            }
          } catch (error) {
            console.error('[GoogleAuthContext] Error processing OAuth redirect:', error);
            setOauthRedirectInProgress(false);
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
      setGoogleTokens,
      setConnectionState
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
      refreshGoogleTokens,
      setConnectionState
    );
  };

  // Function to disconnect Google (wrap the operation)
  const disconnectGoogle = async (): Promise<void> => {
    console.log('[GoogleAuthContext] Disconnecting Google account');
    await disconnectGoogleOperation(
      user, 
      setGoogleTokens, 
      setIsGoogleConnected,
      setConnectionState
    );
  };

  // Debug logging to help diagnose issues
  useEffect(() => {
    console.log('[GoogleAuthContext] Auth State:', { 
      isConnected: isGoogleConnected, 
      hasTokens: !!googleTokens,
      connectionState,
      loading,
      userLoggedIn: !!user,
      oauthRedirectInProgress
    });
  }, [isGoogleConnected, googleTokens, connectionState, loading, user, oauthRedirectInProgress]);

  return (
    <GoogleAuthContext.Provider 
      value={{ 
        googleTokens, 
        isGoogleConnected, 
        loading: loading || oauthRedirectInProgress,
        connectionState,
        refreshGoogleTokens,
        checkGooglePermissions,
        disconnectGoogle,
        refreshTokensState
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
