
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

export function useGoogleCommandHandler() {
  const { isGoogleConnected, loading: googleAuthLoading } = useGoogleAuth();

  const handleGoogleCommand = async (content: string): Promise<boolean> => {
    // Since we've simplified Google integration to just authentication,
    // this handler simply returns true indicating no additional action needed
    
    // Optionally inform user if Google is not connected
    if (!isGoogleConnected && !googleAuthLoading) {
      console.log('Google not connected for command:', content);
    }
    
    return true;
  };

  return {
    handleGoogleCommand
  };
}
