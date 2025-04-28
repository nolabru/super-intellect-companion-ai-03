
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

export function useGoogleCommandHandler() {
  const { isGoogleConnected, loading: googleAuthLoading, refreshTokensState } = useGoogleAuth();

  const handleGoogleCommand = async (content: string): Promise<boolean> => {
    // Since we're only supporting auth, we don't need to handle any commands
    return true;
  };

  return {
    handleGoogleCommand
  };
}
