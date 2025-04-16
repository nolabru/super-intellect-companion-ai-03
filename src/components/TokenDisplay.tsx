
import React, { useState, useEffect } from 'react';
import { CreditCard, Coins, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Progress } from './ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TokenConsumptionRate {
  model_id: string;
  mode: string;
  tokens_per_request: number;
}

const TokenDisplay = () => {
  const { user } = useAuth();
  const [tokensRemaining, setTokensRemaining] = useState<number>(10000);
  const [maxTokens, setMaxTokens] = useState<number>(10000);
  const [nextResetDate, setNextResetDate] = useState<string | null>(null);
  const [rates, setRates] = useState<TokenConsumptionRate[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Get user's token balance
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_tokens')
          .select('tokens_remaining, next_reset_date')
          .eq('user_id', user.id)
          .single();
        
        if (tokenError) {
          console.error('Error fetching token data:', tokenError);
        } else if (tokenData) {
          setTokensRemaining(tokenData.tokens_remaining);
          setNextResetDate(tokenData.next_reset_date);
        }
        
        // Get token consumption rates
        const { data: ratesData, error: ratesError } = await supabase
          .from('token_consumption_rates')
          .select('model_id, mode, tokens_per_request')
          .order('tokens_per_request', { ascending: false });
        
        if (ratesError) {
          console.error('Error fetching token rates:', ratesError);
        } else if (ratesData) {
          setRates(ratesData);
        }
      } catch (err) {
        console.error('Error loading token data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenData();
    
    // Set up real-time subscription to token updates
    const channel = supabase
      .channel('token-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_tokens',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        (payload) => {
          if (payload.new && typeof payload.new.tokens_remaining === 'number') {
            setTokensRemaining(payload.new.tokens_remaining);
            if (payload.new.next_reset_date) {
              setNextResetDate(payload.new.next_reset_date);
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // Format the next reset date
  const formatNextReset = () => {
    if (!nextResetDate) return 'data desconhecida';
    try {
      const date = new Date(nextResetDate);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'data inválida';
    }
  };
  
  // Show top 3 most expensive operations
  const topRates = rates.slice(0, 3);
  
  if (loading) {
    return (
      <div className="flex items-center gap-1 text-inventu-gray text-xs px-3 py-1 animate-pulse">
        <Coins size={14} />
        <span>Carregando tokens...</span>
      </div>
    );
  }
  
  const percentUsed = ((maxTokens - tokensRemaining) / maxTokens) * 100;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 border border-inventu-gray/30 rounded-lg px-3 py-1 bg-inventu-darker hover:bg-inventu-gray/10 cursor-help">
            <Coins size={14} className="text-inventu-accent" />
            <div className="flex items-center gap-1.5">
              <span className="text-white font-medium">{tokensRemaining.toLocaleString()}</span>
              <span className="text-inventu-gray text-xs">tokens</span>
            </div>
            <Progress 
              value={100 - percentUsed} 
              className="w-16 h-1.5 bg-inventu-gray/30" 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 bg-inventu-darker border-inventu-gray/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-inventu-accent" />
              <h3 className="font-medium">Seus Tokens Mensais</h3>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-inventu-gray">Tokens disponíveis:</span>
                <span className="font-medium">{tokensRemaining.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-inventu-gray">Tokens utilizados:</span>
                <span className="font-medium">{(maxTokens - tokensRemaining).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-inventu-gray">Próxima recarga:</span>
                <span className="font-medium">{formatNextReset()}</span>
              </div>
              
              <Progress 
                value={100 - percentUsed} 
                className="mt-2 h-2 bg-inventu-gray/30" 
              />
            </div>
            
            {topRates.length > 0 && (
              <div className="pt-2 border-t border-inventu-gray/20">
                <div className="flex items-center gap-1 mb-2">
                  <Info size={14} className="text-inventu-accent" />
                  <span className="text-xs text-inventu-gray">Custo de operações (tokens):</span>
                </div>
                <div className="space-y-1.5">
                  {topRates.map((rate, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-inventu-gray">
                        {rate.model_id} ({rate.mode}):
                      </span>
                      <span className="font-medium">{rate.tokens_per_request}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TokenDisplay;
