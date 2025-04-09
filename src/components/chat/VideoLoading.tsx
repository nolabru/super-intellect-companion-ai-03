
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoLoadingProps {
  isLoading: boolean;
  isVideo: boolean;
  model: string;
  onTimeout?: () => void;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ 
  isLoading, 
  isVideo, 
  model,
  onTimeout 
}) => {
  // Adicionar um efeito para limitar o tempo de espera do carregamento de vídeo
  useEffect(() => {
    if (isLoading && isVideo) {
      // Definir um timeout para notificar quando o tempo limite de carregamento for excedido
      const timeoutId = setTimeout(() => {
        console.log('Tempo limite de carregamento de vídeo excedido');
        if (onTimeout) {
          onTimeout();
        }
      }, 180000); // 3 minutos de timeout

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isVideo, onTimeout]);

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
        <div className="mt-3 h-1 w-full bg-gray-700 rounded overflow-hidden">
          <div 
            className="h-full bg-inventu-blue opacity-80"
            style={{
              width: '30%',
              animation: 'progressAnimation 2s ease-in-out infinite'
            }}
          ></div>
        </div>
        <style>
          {`
            @keyframes progressAnimation {
              0% {
                margin-left: -30%;
              }
              100% {
                margin-left: 100%;
              }
            }
          `}
        </style>
      </div>
    );
  }
  
  return null;
};

export default VideoLoading;
