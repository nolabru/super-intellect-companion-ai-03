
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserTokens {
  tokensRemaining: number;
  tokensUsed: number;
  loading: boolean;
  error: string | null;
}

export function useUserTokens() {
  const { user } = useAuth();
  const [tokenData, setTokenData] = useState<UserTokens>({
    tokensRemaining: 0,
    tokensUsed: 0,
    loading: true,
    error: null
  });

  const fetchTokens = useCallback(async () => {
    if (!user) {
      setTokenData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setTokenData(prev => ({ ...prev, loading: true }));
      
      // Buscar saldo de tokens do usuário no Supabase
      const { data, error } = await supabase
        .from('user_tokens')
        .select('tokens_remaining, tokens_used')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar saldo de tokens:', error);
        setTokenData({
          tokensRemaining: 0,
          tokensUsed: 0,
          loading: false,
          error: error.message
        });
        return;
      }
      
      setTokenData({
        tokensRemaining: data?.tokens_remaining || 0,
        tokensUsed: data?.tokens_used || 0,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Erro ao buscar saldo de tokens:', err);
      setTokenData({
        tokensRemaining: 0,
        tokensUsed: 0,
        loading: false,
        error: 'Erro ao carregar saldo de tokens'
      });
    }
  }, [user]);

  // Buscar tokens na montagem do componente e quando o usuário mudar
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Função para forçar atualização do saldo
  const refreshTokens = useCallback(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    ...tokenData,
    refreshTokens
  };
}
