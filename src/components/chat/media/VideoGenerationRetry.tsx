
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface VideoGenerationRetryProps {
  onRetry: () => void;
  isChecking: boolean;
  message?: string;
  attempts?: number;
  autoRetry?: boolean;
  autoRetryInterval?: number;
  additionalContent?: React.ReactNode;
}

const VideoGenerationRetry: React.FC<VideoGenerationRetryProps> = ({
  onRetry,
  isChecking = false,
  message = "O tempo de geração do vídeo excedeu o limite. Por favor, verifique novamente.",
  attempts = 0,
  autoRetry = false,
  autoRetryInterval = 10000,
  additionalContent
}) => {
  return (
    <div className="w-full rounded-lg bg-black/5 backdrop-blur p-4 flex flex-col items-center justify-center text-center min-h-[200px] border border-white/10">
      <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
      
      <h3 className="text-lg font-medium text-white mb-2">Verificando Status do Vídeo</h3>
      
      <p className="text-sm text-white/70 max-w-md mb-4">
        {message}
      </p>
      
      <div className="flex flex-col w-full max-w-sm gap-2">
        {attempts > 0 && (
          <p className="text-xs text-white/50 mb-1">
            Tentativas: {attempts} | {autoRetry ? `Verificando a cada ${autoRetryInterval/1000} segundos` : 'Verificação automática desativada'}
          </p>
        )}
        
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isChecking}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Novamente'}
        </Button>
        
        {attempts >= 20 && (
          <div className="mt-2 text-xs text-amber-400">
            <p>Muitas tentativas sem sucesso. O vídeo pode estar com problemas.</p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          </div>
        )}
      </div>

      {/* Adicionar conteúdo adicional se fornecido */}
      {additionalContent && (
        <div className="w-full max-w-sm mt-4">
          {additionalContent}
        </div>
      )}
    </div>
  );
};

export default VideoGenerationRetry;
