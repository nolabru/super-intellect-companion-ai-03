
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { tokenService, TokenBalance } from '@/services/tokenService';

const TokenDisplay = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const balance = await tokenService.getUserTokenBalance(user.id);
        setTokenInfo(balance);
        setError(false);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
    
    // Refresh token info every minute
    const intervalId = setInterval(fetchTokenInfo, 60000);
    
    return () => clearInterval(intervalId);
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

  if (loading) {
    return (
      <div className="flex items-center text-xs text-white/70 px-2 py-1 rounded">
        <Coins size={14} className="mr-1 opacity-70" />
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-xs text-red-300 px-2 py-1 rounded">
        <AlertTriangle size={14} className="mr-1 opacity-70" />
        <span className="animate-pulse">Error</span>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="flex items-center text-xs text-white/70 px-2 py-1 rounded bg-gray-700/30 hover:bg-gray-700/50" title="Token information not available">
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
    <div 
      className={`flex items-center text-xs px-2 py-1 rounded cursor-pointer transition-all
        ${isDepleted 
          ? 'bg-red-900/40 text-red-300 border border-red-800/50 hover:bg-red-900/60' 
          : isLow 
          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50 hover:bg-yellow-900/50' 
          : 'bg-gray-700/30 text-white/70 hover:bg-gray-700/50'
        }`}
      title={`${tokenInfo.tokensRemaining} tokens remaining. ${
        tokenInfo.nextResetDate 
          ? `Next reset in ${formatResetDate(tokenInfo.nextResetDate)}${daysUntilReset !== null ? ` (${daysUntilReset} days)` : ''}.` 
          : 'Reset date not available.'
      } Click to manage your tokens.`}
      onClick={handleTokensClick}
    >
      <Coins size={14} className="mr-1 opacity-70" />
      <span>
        {isDepleted 
          ? 'No tokens!' 
          : isLow 
          ? `Tokens: ${tokenInfo.tokensRemaining} (Low)` 
          : `Tokens: ${tokenInfo.tokensRemaining}`
        }
      </span>
    </div>
  );
};

export default TokenDisplay;
