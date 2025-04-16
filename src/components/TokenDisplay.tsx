
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TokenInfo {
  tokens_remaining: number;
  next_reset_date: string | null;
}

const TokenDisplay = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('tokens_remaining, next_reset_date')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar informações de tokens:', error);
          // Se não tem registro, inicializa com 0 tokens
          if (error.code === 'PGRST116' || error.message.includes('result contains 0 rows')) {
            setTokenInfo({ tokens_remaining: 0, next_reset_date: null });
          } else {
            setError(true);
          }
        } else {
          setTokenInfo(data);
        }
      } catch (err) {
        console.error('Exceção ao buscar tokens:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [user]);

  // Função para formatar data de reset
  const formatResetDate = (dateString: string | null) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const resetDate = new Date(dateString);
      return format(resetDate, "d 'de' MMMM", { locale: ptBR });
    } catch (err) {
      console.error('Erro ao formatar data:', err);
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-xs text-white/70 px-2 py-1 rounded">
        <Coins size={14} className="mr-1 opacity-70" />
        <span className="animate-pulse">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-xs text-red-300 px-2 py-1 rounded">
        <Coins size={14} className="mr-1 opacity-70" />
        <span className="animate-pulse">Erro</span>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="flex items-center text-xs text-white/70 px-2 py-1 rounded bg-gray-700/30 hover:bg-gray-700/50" title="Informações de tokens não disponíveis">
        <Coins size={14} className="mr-1 opacity-70" />
        <span>Tokens: N/A</span>
      </div>
    );
  }

  // Mostrar alerta quando os tokens estiverem acabando (menos de 100)
  const isLow = tokenInfo.tokens_remaining < 100;
  // Mostrar alerta crítico quando não houver mais tokens
  const isDepleted = tokenInfo.tokens_remaining <= 0;

  return (
    <div 
      className={`flex items-center text-xs px-2 py-1 rounded ${
        isDepleted 
          ? 'bg-red-900/40 text-red-300 border border-red-800/50' 
          : isLow 
          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50' 
          : 'bg-gray-700/30 text-white/70 hover:bg-gray-700/50'
      }`}
      title={`${tokenInfo.tokens_remaining} tokens restantes. ${
        tokenInfo.next_reset_date 
          ? `Próximo reset em ${formatResetDate(tokenInfo.next_reset_date)}.` 
          : 'Data de reset não disponível.'
      }`}
    >
      <Coins size={14} className="mr-1 opacity-70" />
      <span>
        {isDepleted 
          ? 'Sem tokens!' 
          : isLow 
          ? `Tokens: ${tokenInfo.tokens_remaining} (Baixo)` 
          : `Tokens: ${tokenInfo.tokens_remaining}`
        }
      </span>
    </div>
  );
};

export default TokenDisplay;
