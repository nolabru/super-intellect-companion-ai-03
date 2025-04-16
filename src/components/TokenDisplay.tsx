
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApiService, UserTokenInfo } from '@/hooks/useApiService';
import { supabase } from '@/integrations/supabase/client';

const TokenDisplay = () => {
  const [tokenInfo, setTokenInfo] = useState<UserTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const apiService = useApiService();
  
  // Fetch token information on component mount
  useEffect(() => {
    const fetchTokenInfo = async () => {
      setLoading(true);
      try {
        const info = await apiService.getUserTokenBalance();
        setTokenInfo(info);
      } catch (error) {
        console.error('Error fetching token information:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenInfo();
    
    // Subscribe to auth state changes to refresh token info when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchTokenInfo();
    });
    
    // Subscribe to realtime database changes for the user_tokens table
    const subscription = supabase
      .channel('token-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_tokens',
        },
        (payload) => {
          // Refresh token info when updated
          fetchTokenInfo();
        }
      )
      .subscribe();
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      supabase.removeChannel(subscription);
    };
  }, []);
  
  // Format next reset date
  const formatResetDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // No user is logged in or data still loading
  if (loading) {
    return (
      <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
    );
  }
  
  // No token info available (user not logged in)
  if (!tokenInfo) {
    return null;
  }
  
  // Calculate percentage of tokens used
  const totalTokens = tokenInfo.tokens_remaining + tokenInfo.tokens_used;
  const percentUsed = Math.round((tokenInfo.tokens_used / totalTokens) * 100);
  
  // Determine badge color based on remaining tokens
  const getBadgeVariant = () => {
    if (tokenInfo.tokens_remaining < 1000) return 'destructive';
    if (tokenInfo.tokens_remaining < 3000) return 'warning';
    return 'secondary';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Badge variant={getBadgeVariant()} className="px-2 py-1">
              {tokenInfo.tokens_remaining.toLocaleString()} tokens
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 p-3 rounded-lg">
          <div className="space-y-2 text-sm text-gray-200">
            <p><strong>Tokens restantes:</strong> {tokenInfo.tokens_remaining.toLocaleString()}</p>
            <p><strong>Tokens usados:</strong> {tokenInfo.tokens_used.toLocaleString()}</p>
            <p><strong>Uso do mês:</strong> {percentUsed}%</p>
            <p><strong>Próximo reset:</strong> {formatResetDate(tokenInfo.next_reset_date)}</p>
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Você recebe 10.000 tokens a cada mês. Gerações de imagem e vídeo consomem mais tokens.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TokenDisplay;
