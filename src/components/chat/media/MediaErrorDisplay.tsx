
import React from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface MediaErrorDisplayProps {
  onRetry: () => void;
  onOpenInNewTab?: () => void;
  mediaUrl?: string | null;
  mode: string;
}

const MediaErrorDisplay: React.FC<MediaErrorDisplayProps> = ({ 
  onRetry, 
  onOpenInNewTab, 
  mediaUrl, 
  mode 
}) => {
  return (
    <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
      <p className="text-sm text-red-400 flex items-start">
        <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
        <span>
          Não foi possível carregar a mídia.
          {mode === 'video' && " Isso pode ocorrer porque o vídeo ainda está sendo processado."}
        </span>
      </p>
      <div className="mt-2 flex space-x-2">
        <button 
          onClick={onRetry}
          className="text-xs bg-red-900/40 hover:bg-red-900/60 text-white py-1 px-2 rounded flex items-center"
        >
          <RefreshCw size={12} className="mr-1" />
          Tentar novamente
        </button>
        {mediaUrl && onOpenInNewTab && (
          <button 
            onClick={onOpenInNewTab}
            className="text-xs bg-inventu-darker/50 hover:bg-inventu-darker/80 text-white py-1 px-2 rounded flex items-center"
          >
            <ExternalLink size={12} className="mr-1" />
            Abrir link diretamente
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaErrorDisplay;
