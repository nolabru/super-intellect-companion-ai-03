
import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoLoadingProps {
  progress?: number;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-inventu-darker border border-inventu-gray/20">
      <Loader2 className="h-5 w-5 mb-3 animate-spin text-inventu-gray" />
      <span className="text-white font-medium mb-1">Gerando vídeo...</span>
      {progress !== undefined && progress > 0 && (
        <div className="w-full mt-3 max-w-xs">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/30 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(Math.max(progress, 5), 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-1 text-center">{Math.round(progress)}% concluído</p>
        </div>
      )}
      <p className="text-xs text-white/50 mt-4 text-center">
        A geração de vídeo pode levar 1-3 minutos para ser concluída.
      </p>
    </div>
  );
};

export default VideoLoading;
