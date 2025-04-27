
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseMediaLoadingOptions {
  onMediaLoaded?: () => void;
  onMediaError?: (error: Error) => void;
  showToasts?: boolean;
}

export const useMediaLoading = (mediaUrl: string | null, options: UseMediaLoadingOptions = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (mediaUrl) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
    }
  }, [mediaUrl]);

  const handleMediaLoaded = () => {
    setIsLoading(false);
    setHasError(false);
    if (options.onMediaLoaded) {
      options.onMediaLoaded();
    }
  };

  const handleMediaError = (e: React.SyntheticEvent<HTMLElement>) => {
    console.error('Media loading error:', e);
    setIsLoading(false);
    setHasError(true);

    if (options.showToasts !== false) {
      toast.error('Erro ao carregar mídia');
    }

    if (options.onMediaError) {
      options.onMediaError(new Error('Failed to load media'));
    }
  };

  const retryMediaLoad = () => {
    if (retryCount >= 3) {
      if (options.showToasts !== false) {
        toast.error('Número máximo de tentativas excedido');
      }
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
    
    if (options.showToasts !== false) {
      toast.info('Tentando carregar mídia novamente...');
    }
  };

  return {
    isLoading,
    hasError,
    retryCount,
    handleMediaLoaded,
    handleMediaError,
    retryMediaLoad
  };
};
