
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

  // Update tokens when session changes
  useEffect(() => {
    if (session) {
      console.log('Session changed, fetching Google tokens');
      fetchGoogleTokens(session);
    }
  }, [session, fetchGoogleTokens]);

  // Check after Google OAuth login
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Verificar parâmetros da URL indicando um redirecionamento de autenticação
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Verificar se este é um redirecionamento após o login OAuth
      if (urlParams.has('provider') || hashParams.has('access_token')) {
        console.log('Processing OAuth redirect in GoogleAuthContext');
        
        // Dar tempo ao Supabase para processar o login
        setTimeout(async () => {
          // Verificar se a sessão existe
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await fetchGoogleTokens(data.session);
            
            // Notificar o usuário se o Google foi conectado com sucesso
            if (isGoogleConnected) {
              console.log('Google successfully connected!');
              toast.success(
                'Google connected successfully!',
                { description: 'Your Google account has been connected.' }
              );
            } else {
              console.log('Google connection status:', isGoogleConnected);
              // Forçar uma nova tentativa após um pequeno atraso
              setTimeout(() => {
                refreshTokensState();
              }, 3000);
            }
          }
        }, 2500);
      }
    };

    checkAuthRedirect();
  }, [fetchGoogleTokens, isGoogleConnected, refreshTokensState]);

  // Function to refresh Google tokens (wrap the operation)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    const result = await refreshGoogleTokensOperation(
      user, 
      googleTokens, 
      setGoogleTokens
    );
    
    // Se os tokens foram atualizados com sucesso, atualizar o estado isGoogleConnected
    if (result) {
      setIsGoogleConnected(true);
    }
    
    return result;
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
