
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoGenerationRetryProps {
  onRetry: () => void;
  message?: string;
  isChecking?: boolean;
  attempts?: number;
}

const VideoGenerationRetry: React.FC<VideoGenerationRetryProps> = ({
  onRetry,
  isChecking = false,
  message = "O tempo de geração do vídeo excedeu o limite. Não se preocupe, o vídeo pode ainda estar sendo processado no servidor.",
  attempts = 0
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 bg-inventu-darker/20 rounded-lg border border-inventu-gray/20">
      <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
      <p className="text-base font-medium text-white text-center">
        Tempo de geração excedido
      </p>
      <p className="text-sm text-inventu-gray mt-2 text-center">
        {message}
      </p>
      
      {attempts > 0 && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs text-inventu-gray mb-1">
            <span>Verificação automática</span>
            <span>{attempts}/5 tentativas</span>
          </div>
          <Progress value={Math.min((attempts / 5) * 100, 100)} className="h-2" />
        </div>
      )}
      
      <Button 
        variant="outline"
        className="mt-4 flex items-center gap-2"
        onClick={onRetry}
        disabled={isChecking}
      >
        <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        {isChecking ? 'Verificando...' : 'Verificar novamente'}
      </Button>
      
      {attempts >= 5 && (
        <p className="text-xs text-amber-400/80 mt-2 text-center">
          Verificações automáticas esgotadas. Use o botão acima para verificar manualmente.
        </p>
      )}
    </div>
  );
};

export default VideoGenerationRetry;
