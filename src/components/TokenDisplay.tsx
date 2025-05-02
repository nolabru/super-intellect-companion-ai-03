
import React, { useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TokenDisplay: React.FC = () => {
  const { tokensRemaining, loading, refreshTokens } = useUserTokens();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Forçar atualização do saldo de tokens quando o componente montar ou o usuário mudar
  useEffect(() => {
    if (user) {
      refreshTokens();
    }
  }, [user, refreshTokens]);

  // Lidar com cliques no ícone de tokens
  const handleTokenClick = () => {
    if (!user) {
      toast.error('É necessário fazer login para ver seus tokens');
      navigate('/auth');
      return;
    }
    
    navigate('/tokens');
  };

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      onClick={handleTokenClick}
      className="text-white flex items-center space-x-2 hover:bg-inventu-gray/20"
      title="Ver saldo de tokens"
    >
      <Coins className="h-4 w-4" />
      <span className="font-medium">
        {loading ? '...' : tokensRemaining.toLocaleString()}
      </span>
    </Button>
  );
};

export default TokenDisplay;
