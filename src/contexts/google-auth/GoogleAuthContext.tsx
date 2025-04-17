
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

  // Estado para rastrear se as permissões foram verificadas
  const [permissionsVerified, setPermissionsVerified] = useState<boolean>(false);
  // Estado para controlar quando foi a última verificação de permissões
  const [lastPermissionCheck, setLastPermissionCheck] = useState<number>(0);

  // Update tokens when session changes
  useEffect(() => {
    if (session?.user) {
      console.log("[GoogleAuthProvider] Sessão detectada, buscando tokens Google");
      fetchGoogleTokens(session);
    } else {
      console.log("[GoogleAuthProvider] Sem sessão, resetando tokens Google");
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setPermissionsVerified(false);
    }
  }, [session]);

  // Verificar permissões quando os tokens são carregados
  useEffect(() => {
    const verifyPermissions = async () => {
      if (isGoogleConnected && googleTokens && !loading) {
        // Verificar se já passaram pelo menos 12 horas desde a última verificação
        const now = Date.now();
        const twelveHoursInMs = 12 * 60 * 60 * 1000;
        
        if (permissionsVerified && now - lastPermissionCheck < twelveHoursInMs) {
          console.log("[GoogleAuthProvider] Pulando verificação de permissões, já verificado recentemente");
          return;
        }
        
        console.log("[GoogleAuthProvider] Verificando permissões do Google após carregar tokens");
        const hasPermissions = await checkGooglePermissionsOperation(
          user, 
          googleTokens, 
          refreshGoogleTokens
        );
        
        if (hasPermissions) {
          console.log("[GoogleAuthProvider] Permissões do Google verificadas com sucesso");
          setPermissionsVerified(true);
          setLastPermissionCheck(now);
          
          // Salvar estado de verificação em localStorage para persistência entre sessões
          localStorage.setItem('google_permissions_verified', 'true');
          localStorage.setItem('google_last_permission_check', now.toString());
        } else {
          console.warn("[GoogleAuthProvider] Falha na verificação das permissões do Google");
          // Não desconectar automaticamente para não interromper o fluxo do usuário
        }
      }
    };
    
    verifyPermissions();
  }, [isGoogleConnected, googleTokens, loading]);

  // Restaurar estado de verificação de permissões ao iniciar
  useEffect(() => {
    if (isGoogleConnected) {
      const savedPermissionsVerified = localStorage.getItem('google_permissions_verified') === 'true';
      const savedLastCheck = localStorage.getItem('google_last_permission_check');
      
      if (savedPermissionsVerified) {
        setPermissionsVerified(true);
        if (savedLastCheck) {
          setLastPermissionCheck(parseInt(savedLastCheck, 10));
        }
      }
    }
  }, [isGoogleConnected]);

  // Check after Google OAuth login
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Check for URL parameters indicating an authentication redirect
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      // Check if this is a redirect after OAuth login
      if (urlParams.has('provider') || hashParams.has('access_token') || 
          urlParams.has('success') || urlParams.has('error')) {
        console.log('[GoogleAuthProvider] Processando redirecionamento OAuth');
        
        if (urlParams.has('error')) {
          const error = urlParams.get('error');
          toast.error(
            'Erro na conexão com o Google',
            { description: `Ocorreu um erro: ${error}` }
          );
          return;
        }
        
        if (urlParams.has('success')) {
          console.log('[GoogleAuthProvider] Conexão com Google bem-sucedida via URL success param');
          
          // Give Supabase time to process the login
          setTimeout(async () => {
            if (user) {
              await fetchGoogleTokens(session);
              
              // Notify user
              if (isGoogleConnected) {
                toast.success(
                  'Google conectado com sucesso!',
                  { description: 'Sua conta Google foi conectada e as permissões foram salvas.' }
                );
                
                // Marcar como verificado para evitar verificações repetidas
                setPermissionsVerified(true);
                setLastPermissionCheck(Date.now());
                localStorage.setItem('google_permissions_verified', 'true');
                localStorage.setItem('google_last_permission_check', Date.now().toString());
              }
            }
          }, 1000);
          return;
        }
        
        // Give Supabase time to process the login (para outros casos de redirecionamento)
        setTimeout(async () => {
          // Check if session exists
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await fetchGoogleTokens(data.session);
            
            // Notify user
            if (isGoogleConnected) {
              toast.success(
                'Google conectado com sucesso!',
                { description: 'Sua conta Google foi conectada e as permissões foram salvas.' }
              );
              
              // Marcar como verificado para evitar verificações repetidas
              setPermissionsVerified(true);
              setLastPermissionCheck(Date.now());
              localStorage.setItem('google_permissions_verified', 'true');
              localStorage.setItem('google_last_permission_check', Date.now().toString());
            }
          }
        }, 1000);
        
        // Limpar URL após processamento para evitar reprocessamento em atualizações
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkAuthRedirect();
  }, []);

  // Function to refresh Google tokens (wrap the operation)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    console.log("[GoogleAuthProvider] Tentando atualizar tokens do Google");
    const success = await refreshGoogleTokensOperation(
      user, 
      googleTokens, 
      setGoogleTokens
    );
    
    if (success) {
      console.log("[GoogleAuthProvider] Tokens do Google atualizados com sucesso");
    } else {
      console.error("[GoogleAuthProvider] Falha ao atualizar tokens do Google");
    }
    
    return success;
  };

  // Function to check Google permissions (wrap the operation)
  const checkGooglePermissions = async (): Promise<boolean> => {
    console.log("[GoogleAuthProvider] Verificando permissões do Google");
    const hasPermissions = await checkGooglePermissionsOperation(
      user, 
      googleTokens, 
      refreshGoogleTokens
    );
    
    if (hasPermissions) {
      setPermissionsVerified(true);
      setLastPermissionCheck(Date.now());
      localStorage.setItem('google_permissions_verified', 'true');
      localStorage.setItem('google_last_permission_check', Date.now().toString());
      console.log("[GoogleAuthProvider] Permissões do Google verificadas: OK");
    } else {
      console.warn("[GoogleAuthProvider] Permissões do Google insuficientes ou ausentes");
    }
    
    return hasPermissions;
  };

  // Function to disconnect Google (wrap the operation)
  const disconnectGoogle = async (): Promise<void> => {
    console.log("[GoogleAuthProvider] Desconectando conta do Google");
    await disconnectGoogleOperation(
      user, 
      setGoogleTokens, 
      setIsGoogleConnected
    );
    setPermissionsVerified(false);
    localStorage.removeItem('google_permissions_verified');
    localStorage.removeItem('google_last_permission_check');
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
