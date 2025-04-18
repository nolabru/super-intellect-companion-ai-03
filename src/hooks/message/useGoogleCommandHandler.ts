
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

export function useGoogleCommandHandler() {
  const { isGoogleConnected, loading: googleAuthLoading, refreshTokensState } = useGoogleAuth();

  const handleGoogleCommand = async (content: string): Promise<boolean> => {
    const isGoogleCommand = content.match(/@(calendar|sheet|doc|drive|email)\s/i);
    
    if (!isGoogleCommand) return true;

    if (googleAuthLoading) {
      console.log('[GoogleCommandHandler] Esperando o carregamento da autenticação Google...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshTokensState();
    }

    if (!isGoogleConnected) {
      toast.error(
        'Conta Google não conectada',
        { description: 'Para usar comandos Google, você precisa fazer login com sua conta Google.' }
      );
      return false;
    }

    return true;
  };

  return {
    handleGoogleCommand
  };
}
