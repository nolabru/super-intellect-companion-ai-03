
import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoLoadingProps {
  isLoading: boolean;
  isVideo: boolean;
  model: string;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ isLoading, isVideo, model }) => {
  if (isLoading && isVideo) {
    const isKliginVideo = model === 'kligin-video';
    const isLumaVideo = model === 'luma-video';
    
    return (
      <div className="flex flex-col items-center justify-center p-4 my-2 bg-inventu-darker/20 rounded-lg">
        <Loader2 className="h-10 w-10 mb-2 animate-spin text-inventu-gray" />
        <p className="text-sm text-inventu-gray">
          {isKliginVideo 
            ? "O serviço Kligin AI está processando seu vídeo..." 
            : isLumaVideo
            ? "O serviço Luma AI está processando seu vídeo..."
            : "Gerando seu vídeo..."}
        </p>
        <p className="text-xs text-inventu-gray/70 mt-1">
          Isso pode levar alguns instantes. Por favor, aguarde.
        </p>
      </div>
    );
  }
  
  return null;
};

export default VideoLoading;
