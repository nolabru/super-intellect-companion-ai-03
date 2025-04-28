
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

export function useGoogleCommandHandler() {
  const { isGoogleConnected, loading: googleAuthLoading, refreshTokensState } = useGoogleAuth();

  const handleGoogleCommand = async (content: string): Promise<boolean> => {
    // Since we've removed Google Workspace integrations and only kept auth functionality,
    // this handler will just return true indicating no further action is needed
    
    // If Google is not connected, we might want to inform the user
    if (!isGoogleConnected && !googleAuthLoading) {
      console.log('Google not connected for command:', content);
      // Optional: Show toast notification if you want to inform users
      // toast.info('Google integration is available for authentication only');
    }
    
    return true;
  };

  return {
    handleGoogleCommand
  };
}
