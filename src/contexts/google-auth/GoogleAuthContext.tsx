
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleTokens } from './useGoogleTokens';
import { 
  refreshGoogleTokens as refreshGoogleTokensOperation,
  checkGooglePermissions as checkGooglePermissionsOperation,
  disconnectGoogle as disconnectGoogleOperation
} from './googleAuthOperations';
import { GoogleAuthContextType } from './types';
import { useLocation } from 'react-router-dom';

// Create context with undefined initial value
const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const location = useLocation();
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
        console.log('[GoogleAuthContext] Session changed, fetching Google tokens');
        fetchGoogleTokens(session).catch(err => {
          console.error('[GoogleAuthContext] Error fetching tokens:', err);
        });
      }
    }, [session, fetchGoogleTokens]);

    // Check after Google OAuth login
    useEffect(() => {
      const checkAuthRedirect = async () => {
        try {
          // Check for URL parameters indicating an authentication redirect
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
          
          // Log all URL parameters for debugging
          console.log('[GoogleAuthContext] Current URL path:', window.location.pathname);
          console.log('[GoogleAuthContext] URL params:', Object.fromEntries(urlParams.entries()));
          console.log('[GoogleAuthContext] Hash params:', Object.fromEntries(hashParams.entries()));
          
          // Check if this is a redirect after OAuth login
          const isOAuthRedirect = urlParams.has('provider') || 
                                  hashParams.has('access_token') || 
                                  urlParams.has('success');
                                  
          if (isOAuthRedirect) {
            console.log('[GoogleAuthContext] Processing OAuth redirect');
            
            // Give Supabase time to process the login
            setTimeout(async () => {
              try {
                // Check if session exists
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                  console.log('[GoogleAuthContext] Session found after redirect, fetching Google tokens');
                  const tokens = await fetchGoogleTokens(data.session);
                  
                  // Notify user if connected
                  if (tokens) {
                    toast.success(
                      'Google conectado com sucesso!',
                      { description: 'Sua conta Google foi conectada.' }
                    );
                  }
                } else {
                  console.log('[GoogleAuthContext] No session found after redirect');
                }
              } catch (err) {
                console.error('[GoogleAuthContext] Error processing redirect:', err);
              }
            }, 1000);
          }
          
          // Special handling for the /google-integrations page with success parameter
          const isSuccessRedirect = window.location.pathname === '/google-integrations' && 
                                  urlParams.has('success');
                                  
          if (isSuccessRedirect) {
            console.log('[GoogleAuthContext] Processing success redirect on Google Integrations page');
            // Will be handled by the component-specific effect
          }
        } catch (err) {
          console.error('[GoogleAuthContext] Error in checkAuthRedirect:', err);
        }
      };

      checkAuthRedirect().catch(err => {
        console.error('[GoogleAuthContext] Unhandled error in checkAuthRedirect:', err);
      });
    }, [fetchGoogleTokens, location]);

    // Function to refresh Google tokens (wrap the operation)
    const refreshGoogleTokens = async (): Promise<boolean> => {
      try {
        console.log('[GoogleAuthContext] Attempting to refresh Google tokens');
        return await refreshGoogleTokensOperation(
          user, 
          googleTokens, 
          setGoogleTokens
        );
      } catch (err) {
        console.error('[GoogleAuthContext] Error refreshing tokens:', err);
        return false;
      }
    };

    // Function to check Google permissions (wrap the operation)
    const checkGooglePermissions = async (): Promise<boolean> => {
      try {
        console.log('[GoogleAuthContext] Checking Google permissions');
        const result = await checkGooglePermissionsOperation(
          user, 
          googleTokens, 
          refreshGoogleTokens
        );
        
        console.log('[GoogleAuthContext] Google permissions check result:', result);
        return result;
      } catch (err) {
        console.error('[GoogleAuthContext] Error checking permissions:', err);
        return false;
      }
    };

    // Function to disconnect Google (wrap the operation)
    const disconnectGoogle = async (): Promise<void> => {
      try {
        await disconnectGoogleOperation(
          user, 
          setGoogleTokens, 
          setIsGoogleConnected
        );
      } catch (err) {
        console.error('[GoogleAuthContext] Error disconnecting Google:', err);
        toast.error('Erro ao desconectar do Google');
      }
    };

    const contextValue = {
      googleTokens, 
      isGoogleConnected, 
      loading, 
      refreshGoogleTokens,
      checkGooglePermissions,
      disconnectGoogle
    };

    return (
      <GoogleAuthContext.Provider value={contextValue}>
        {children}
      </GoogleAuthContext.Provider>
    );
  } catch (error) {
    console.error('[GoogleAuthProvider] Error initializing context:', error);
    // Return children without context in case of error to prevent app from crashing
    return <>{children}</>;
  }
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};
