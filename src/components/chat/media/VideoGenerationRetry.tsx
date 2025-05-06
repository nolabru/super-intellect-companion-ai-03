
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoGenerationRetryProps {
  onRetry: () => void;
  message?: string;
}

const VideoGenerationRetry: React.FC<VideoGenerationRetryProps> = ({
  onRetry,
  message = "O tempo de geração do vídeo excedeu o limite. Não se preocupe, o vídeo pode ainda estar sendo processado no servidor."
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
      <Button 
        variant="outline"
        className="mt-4 flex items-center gap-2"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4" />
        Verificar novamente
      </Button>
    </div>
  );
};

export default VideoGenerationRetry;
