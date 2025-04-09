
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
      <div className="flex flex-col items-center justify-center p-6 my-4 bg-inventu-darker/20 rounded-lg border border-inventu-gray/20">
        <Loader2 className="h-12 w-12 mb-4 animate-spin text-inventu-blue" />
        <p className="text-base font-medium text-white">
          {isKliginVideo 
            ? "O serviço Kligin AI está processando seu vídeo..." 
            : isLumaVideo
            ? "A Luma AI está processando sua solicitação de vídeo..."
            : "Gerando seu vídeo..."}
        </p>
        <p className="text-sm text-inventu-gray mt-2 text-center">
          {isLumaVideo 
            ? "O processo pode levar entre 30 segundos e 2 minutos dependendo da complexidade. Estamos usando a SDK oficial da Luma."
            : "Isso pode levar alguns instantes. Por favor, aguarde."}
        </p>
        <div className="mt-4 h-2 w-full bg-inventu-darker rounded-full overflow-hidden">
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
