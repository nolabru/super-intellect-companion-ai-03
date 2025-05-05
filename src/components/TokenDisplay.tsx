
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { tokenService, TokenBalance } from '@/services/tokenService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Create a global event bus for token updates
export const tokenEvents = {
  // Use a Set to store subscribers
  subscribers: new Set<() => void>(),
  
  // Method to trigger a refresh for all subscribers
  triggerRefresh: () => {
    console.log('Token refresh event triggered with', tokenEvents.subscribers.size, 'subscribers');
    tokenEvents.subscribers.forEach(callback => {
      console.log('Calling subscriber callback');
      callback();
    });
  },
  
  // Subscribe to token updates
  subscribe: (callback: () => void) => {
    console.log('New token event subscriber added');
    tokenEvents.subscribers.add(callback);
    return () => {
      console.log('Token event subscriber removed');
      tokenEvents.subscribers.delete(callback);
    };
  }
};

const TokenDisplay = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showLowAlert, setShowLowAlert] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fetchTimestamp, setFetchTimestamp] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTokenInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching token info in TokenDisplay component');
      // Retry with cache clearing if we've had issues before
      if (retryCount > 0) {
        console.log('Clearing token cache before retry attempt');
        tokenService.clearBalanceCache();
      }

      const balance = await tokenService.getUserTokenBalance(user.id);
      console.log('Token balance fetched:', balance);
      setTokenInfo(balance);
      setError(false);
      setFetchTimestamp(Date.now());
      
      // Show low token warning if appropriate
      if (balance.tokensRemaining < 100 && !showLowAlert) {
        setShowLowAlert(true);
        toast.warning('Token balance is low', {
          description: `You have ${balance.tokensRemaining} tokens remaining.`,
          action: {
            label: 'View details',
            onClick: () => navigate('/tokens'),
          },
          duration: 5000,
        });
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(true);
      
      // If we encounter an error, increment retry counter to clear cache on next attempt
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TokenDisplay: Initial fetch');
    fetchTokenInfo();
    
    // Refresh token info every 5 seconds
    const intervalId = setInterval(() => {
      console.log('TokenDisplay: Interval fetch');
      fetchTokenInfo();
    }, 5000);
    
    // Subscribe to token events for real-time updates
    const unsubscribe = tokenEvents.subscribe(() => {
      console.log('TokenDisplay received refresh event, clearing cache and fetching new token info');
      tokenService.clearBalanceCache();
      fetchTokenInfo();
    });
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [user]);

  // Add an effect that reacts when user changes
  useEffect(() => {
    if (user) {
      console.log('TokenDisplay: User changed, clearing cache and fetching');
      tokenService.clearBalanceCache();
      fetchTokenInfo();
    }
  }, [user]);

  // Format reset date
  const formatResetDate = (dateString: string | null) => {
    if (!dateString) return 'Date not available';
    
    try {
      const resetDate = new Date(dateString);
      return format(resetDate, "d 'of' MMMM", { locale: ptBR });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };
  
  // Calculate days until reset
  const getDaysUntilReset = () => {
    if (!tokenInfo?.nextResetDate) return null;
    return tokenService.getDaysUntilReset(tokenInfo.nextResetDate);
  };
  
  const handleTokensClick = () => {
    if (user) {
      navigate('/tokens');
    }
  };
  
  // Retry fetching tokens on error click
  const handleErrorClick = () => {
    if (error) {
      tokenService.clearBalanceCache();
      setLoading(true);
      setRetryCount(prev => prev + 1);
      fetchTokenInfo();
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('TokenDisplay: Manual refresh requested');
    tokenService.clearBalanceCache();
    setLoading(true);
    fetchTokenInfo();
  };

  if (loading) {
    return (
      <div className="flex items-center text-xs text-white/70 px-2 py-1 rounded cursor-pointer" onClick={handleManualRefresh}>
        <Coins size={14} className="mr-1 opacity-70 animate-pulse" />
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center text-xs text-red-300 px-2 py-1 rounded cursor-pointer hover:bg-red-900/30"
        onClick={handleErrorClick}
        title="Click to retry"
      >
        <AlertTriangle size={14} className="mr-1 opacity-70" />
        <span>Retry</span>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div 
        className="flex items-center text-xs text-white/70 px-2 py-1 rounded bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer" 
        title="Token information not available" 
        onClick={handleManualRefresh}
      >
        <Coins size={14} className="mr-1 opacity-70" />
        <span>Tokens: N/A</span>
      </div>
    );
  }

  // Token states
  const isLow = tokenInfo.tokensRemaining < 100;
  const isDepleted = tokenInfo.tokensRemaining <= 0;
  const daysUntilReset = getDaysUntilReset();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center text-xs px-2 py-1 rounded cursor-pointer transition-all
              ${isDepleted 
                ? 'bg-red-900/40 text-red-300 border border-red-800/50 hover:bg-red-900/60' 
                : isLow 
                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50 hover:bg-yellow-900/50' 
                : 'bg-gray-700/30 text-white/70 hover:bg-gray-700/50'
              }`}
            onClick={handleTokensClick}
            onDoubleClick={handleManualRefresh}
            title="Click to view tokens. Double-click to refresh."
            data-timestamp={fetchTimestamp}
          >
            <Coins size={14} className="mr-1 opacity-70" />
            <span className="mr-1">
              {isDepleted 
                ? 'No tokens!' 
                : `${tokenInfo.tokensRemaining}`
              }
            </span>
            {isLow && !isDepleted && (
              <Badge variant="outline" className="bg-yellow-900/50 text-yellow-200 text-[0.6rem] px-1 py-0 border-yellow-700/50">
                Low
              </Badge>
            )}
            {isDepleted && (
              <Badge variant="outline" className="bg-red-900/50 text-red-200 text-[0.6rem] px-1 py-0 border-red-700/50">
                Empty
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-800/90 border-gray-700 text-white max-w-[300px]">
          <div className="text-xs space-y-1">
            <p className="font-semibold">{tokenInfo.tokensRemaining} tokens remaining</p>
            <p className="text-gray-300">Used: {tokenInfo.tokensUsed} tokens</p>
            {tokenInfo.nextResetDate && (
              <p className="text-gray-300">
                Reset: {formatResetDate(tokenInfo.nextResetDate)}
                {daysUntilReset !== null ? ` (${daysUntilReset} days)` : ''}
              </p>
            )}
            <p className="text-gray-400 mt-1 text-2xs">Click to manage your tokens. Double-click to refresh.</p>
            <p className="text-gray-500 text-2xs">Last updated: {new Date(fetchTimestamp).toLocaleTimeString()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TokenDisplay;
