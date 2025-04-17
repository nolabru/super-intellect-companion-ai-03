
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// Define a new interface for the user_google_tokens table
interface UserGoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: string;
  updated_at: string;
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
  const { session, user } = useAuth();
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Função para obter os tokens do Google armazenados no Supabase
  const fetchGoogleTokens = async (session: Session | null) => {
    if (!session || !session.user) {
      setGoogleTokens(null);
      setIsGoogleConnected(false);
      setLoading(false);
      return;
    }

    try {
      // Use the raw query method to avoid TypeScript issues with database schema types
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Erro ao buscar tokens do Google:', error);
        setGoogleTokens(null);
        setIsGoogleConnected(false);
      } else if (data && data.length > 0) {
        const tokenData = data[0] as UserGoogleToken;
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
      console.error('Erro ao buscar tokens do Google:', error);
      setGoogleTokens(null);
      setIsGoogleConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar os tokens quando a sessão mudar
  useEffect(() => {
    fetchGoogleTokens(session);
  }, [session]);

  // Verificar após login OAuth do Google
  useEffect(() => {
    const checkAuthRedirect = async () => {
      // Verificar se este é um redirecionamento após um login OAuth
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      if (hashParams.has('provider') && hashParams.get('provider') === 'google') {
        // Dar um tempo para o Supabase processar o login
        setTimeout(async () => {
          // Verificar se a sessão existe
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await fetchGoogleTokens(data.session);
            
            // Notificar o usuário
            if (isGoogleConnected) {
              toast.success(
                'Google conectado com sucesso!',
                { description: 'Sua conta Google foi conectada corretamente.' }
              );
            }
          }
        }, 1000);
      }
    };

    checkAuthRedirect();
  }, []);

  // Função para renovar tokens do Google (quando expirados)
  const refreshGoogleTokens = async (): Promise<boolean> => {
    if (!user || !googleTokens?.refreshToken) {
      return false;
    }

    try {
      // Chamada à função Edge do Supabase que renovará o token
      const { data, error } = await supabase.functions.invoke('google-token-refresh', {
        body: { 
          userId: user.id,
          refreshToken: googleTokens.refreshToken
        }
      });

      if (error) {
        console.error('Erro ao renovar tokens do Google:', error);
        return false;
      }

      if (data && data.success) {
        // Atualizar o estado com os novos tokens
        setGoogleTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || googleTokens.refreshToken,
          expiresAt: data.expiresAt,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao renovar tokens do Google:', error);
      return false;
    }
  };

  // Função para verificar se as permissões do Google estão ativas
  const checkGooglePermissions = async (): Promise<boolean> => {
    if (!user || !googleTokens?.accessToken) {
      return false;
    }

    // Verificar se o token está expirado
    const now = Math.floor(Date.now() / 1000);
    if (googleTokens.expiresAt && googleTokens.expiresAt < now) {
      // Token expirado, tentar renovar
      const refreshed = await refreshGoogleTokens();
      if (!refreshed) return false;
    }

    try {
      // Chamar uma API simples do Google para verificar se o token está funcionando
      const { data, error } = await supabase.functions.invoke('google-verify-permissions', {
        body: { 
          accessToken: googleTokens.accessToken
        }
      });

      return data?.success || false;
    } catch (error) {
      console.error('Erro ao verificar permissões do Google:', error);
      return false;
    }
  };

  // Função para desconectar a conta do Google
  const disconnectGoogle = async (): Promise<void> => {
    if (!user) return;

    try {
      // Delete tokens directly from the table instead of using RPC
      const { error } = await supabase
        .from('user_google_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Limpar o estado local
      setGoogleTokens(null);
      setIsGoogleConnected(false);

      toast.success(
        'Google desconectado',
        { description: 'Sua conta Google foi desconectada com sucesso.' }
      );
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      toast.error(
        'Erro ao desconectar',
        { description: 'Não foi possível desconectar sua conta Google.' }
      );
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
