
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
  const { user } = useAuth();
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

  // Debug logging de inicialização
  useEffect(() => {
    console.log('[GoogleAuthContext] Inicialização com usuário:', !!user);
  }, []);

  // Atualizar tokens quando o usuário mudar
  useEffect(() => {
    if (user) {
      console.log('[GoogleAuthContext] Usuário detectado, buscando tokens Google');
      fetchGoogleTokens(user);
      setupTokenChecking(user);
    } else {
      console.log('[GoogleAuthContext] Nenhum usuário, limpando tokens Google');
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setConnectionState(GoogleConnectionState.DISCONNECTED);
    }
  }, [user, fetchGoogleTokens, setGoogleTokens, setIsGoogleConnected, setConnectionState, setupTokenChecking]);

  // Verificar parâmetros de redirecionamento OAuth apenas uma vez na montagem do componente
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Verificar parâmetros de URL indicando um redirecionamento de autenticação
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Verificar se este é um redirecionamento após login OAuth
      if (
        (urlParams.has('provider') && urlParams.get('provider') === 'google') || 
        hashParams.has('access_token')
      ) {
        console.log('[GoogleAuthContext] Detectado redirecionamento OAuth do Google');
        setOauthRedirectInProgress(true);
        
        // Dar tempo ao Supabase para processar o login
        setTimeout(async () => {
          try {
            // Verificar se a sessão existe
            const { data } = await supabase.auth.getSession();
            if (data.session && data.session.user) {
              console.log('[GoogleAuthContext] Sessão encontrada após redirecionamento OAuth, buscando tokens');
              await fetchGoogleTokens(data.session.user);
              
              // Forçar outra verificação após um atraso maior
              setTimeout(async () => {
                console.log('[GoogleAuthContext] Realizando verificação de token com atraso');
                await refreshTokensState();
                
                // Notificar o usuário com base no status de conexão atualizado
                if (isGoogleConnected) {
                  toast.success(
                    'Google conectado com sucesso!',
                    { description: 'Sua conta Google foi conectada.' }
                  );
                } else {
                  console.log('[GoogleAuthContext] Status de conexão Google após verificação com atraso:', isGoogleConnected);
                  await fetchGoogleTokens(data.session.user);
                  
                  // Uma verificação final com um atraso ainda maior
                  setTimeout(async () => {
                    console.log('[GoogleAuthContext] Realizando verificação final de token');
                    await refreshTokensState();
                    
                    if (isGoogleConnected) {
                      toast.success(
                        'Google conectado com sucesso!',
                        { description: 'Sua conta Google foi conectada.' }
                      );
                    } else {
                      toast.error(
                        'Falha ao conectar conta Google',
                        { description: 'Por favor, tente novamente ou entre em contato com o suporte.' }
                      );
                    }
                    
                    setOauthRedirectInProgress(false);
                  }, 5000);
                }
              }, 3000);
            } else {
              console.log('[GoogleAuthContext] Nenhuma sessão encontrada após redirecionamento OAuth');
              setOauthRedirectInProgress(false);
            }
          } catch (error) {
            console.error('[GoogleAuthContext] Erro ao processar redirecionamento OAuth:', error);
            setOauthRedirectInProgress(false);
          }
        }, 2500);
      }
    };

    checkAuthRedirect();
  }, [fetchGoogleTokens, isGoogleConnected, refreshTokensState]);

  // Função para atualizar tokens Google (encapsular a operação)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    console.log('[GoogleAuthContext] Tentando atualizar tokens Google');
    const result = await refreshGoogleTokensOperation(
      user, 
      googleTokens, 
      setGoogleTokens,
      setConnectionState
    );
    
    // Atualizar isGoogleConnected se os tokens foram atualizados com sucesso
    if (result) {
      setIsGoogleConnected(true);
      console.log('[GoogleAuthContext] Tokens atualizados com sucesso, definindo estado conectado');
    } else {
      console.log('[GoogleAuthContext] Falha na atualização de token');
    }
    
    return result;
  };

  // Função para verificar permissões Google (encapsular a operação)
  const checkGooglePermissions = async (): Promise<boolean> => {
    console.log('[GoogleAuthContext] Verificando permissões Google');
    return await checkGooglePermissionsOperation(
      user, 
      googleTokens, 
      refreshGoogleTokens,
      setConnectionState
    );
  };

  // Função para desconectar Google (encapsular a operação)
  const disconnectGoogle = async (): Promise<void> => {
    console.log('[GoogleAuthContext] Desconectando conta Google');
    await disconnectGoogleOperation(
      user, 
      setGoogleTokens, 
      setIsGoogleConnected,
      setConnectionState
    );
  };

  // Logging de depuração para ajudar a diagnosticar problemas
  useEffect(() => {
    console.log('[GoogleAuthContext] Estado de autenticação:', { 
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
