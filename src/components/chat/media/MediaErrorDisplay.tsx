
import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';

interface MediaErrorDisplayProps {
  error: string;
  onRetry: () => void;
  onOpenInNewTab: () => void;
  mediaUrl: string;
  mode: ChatMode;
}

const MediaErrorDisplay: React.FC<MediaErrorDisplayProps> = ({
  error,
  onRetry,
  onOpenInNewTab,
  mediaUrl,
  mode
}) => {
  return (
    <div className="mt-2 p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-center">
      <div className="flex flex-col items-center gap-2">
        <AlertCircle className="h-8 w-8 text-red-500 mb-1" />
        <h3 className="text-sm font-medium text-red-500">Erro ao carregar {mode === 'image' ? 'imagem' : mode === 'video' ? 'vídeo' : 'áudio'}</h3>
        <p className="text-xs text-red-400/80 mb-3">{error}</p>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInNewTab}
            className="flex items-center gap-1 border-red-500/30 hover:bg-red-500/10"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir em nova aba
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaErrorDisplay;
