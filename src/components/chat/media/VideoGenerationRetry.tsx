
import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoGenerationRetryProps {
  onRetry: () => void;
  message?: string;
  isChecking?: boolean;
  attempts?: number;
  autoRetry?: boolean;
  autoRetryInterval?: number;
}

const VideoGenerationRetry: React.FC<VideoGenerationRetryProps> = ({
  onRetry,
  isChecking = false,
  message = "O tempo de geração do vídeo excedeu o limite. Não se preocupe, o vídeo pode ainda estar sendo processado no servidor.",
  attempts = 0,
  autoRetry = true,
  autoRetryInterval = 15000
}) => {
  // Add automatic retry effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    // If autoRetry is enabled and not currently checking and attempts are below max,
    // start automatic retry interval
    if (autoRetry && !isChecking && attempts < 10) {
      intervalId = setInterval(() => {
        console.log('Automatic retry triggered');
        onRetry();
      }, autoRetryInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRetry, isChecking, attempts, onRetry, autoRetryInterval]);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 bg-inventu-darker/20 rounded-lg border border-inventu-gray/20">
      <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
      <p className="text-base font-medium text-white text-center">
        Tempo de geração excedido
      </p>
      <p className="text-sm text-inventu-gray mt-2 text-center">
        {message}
      </p>
      
      <div className="w-full mt-4">
        <div className="flex justify-between text-xs text-inventu-gray mb-1">
          <span>Verificação automática</span>
          <span>{attempts}/10 verificações</span>
        </div>
        <Progress value={Math.min((attempts / 10) * 100, 100)} className="h-2" />
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <RefreshCw className={`h-5 w-5 text-inventu-gray ${isChecking ? 'animate-spin' : ''}`} />
        <p className="text-sm text-inventu-gray">
          {isChecking ? 'Verificando...' : 'Verificando automaticamente...'}
        </p>
      </div>
      
      {attempts >= 10 && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xs text-amber-400/80 mb-2 text-center">
            Verificações automáticas esgotadas. Use o botão abaixo para verificar manualmente.
          </p>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={onRetry}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar manualmente'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoGenerationRetry;
