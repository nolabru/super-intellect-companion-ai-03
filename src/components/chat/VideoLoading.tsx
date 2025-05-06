import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoLoadingProps {
  isLoading: boolean;
  isVideo: boolean;
  model: string;
  progress?: number;
  onTimeout?: () => void;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ 
  isLoading, 
  isVideo, 
  model,
  progress,
  onTimeout 
}) => {
  // Add timeout effect for video loading but with improved persistence
  useEffect(() => {
    if (isLoading && isVideo) {
      // Set a timeout to notify when loading exceeds the time limit
      console.log('[VideoLoading] Setting timeout for 20 minutes');
      
      // Use a much longer timeout (20 minutes) to ensure completion
      const timeoutId = setTimeout(() => {
        // Only timeout if progress is less than 90%
        // This prevents timeouts when we're at 95% and just waiting for final completion
        if (!progress || progress < 90) {
          console.log('[VideoLoading] Video loading timeout exceeded after 20 minutes');
          if (onTimeout) {
            onTimeout();
          }
        } else {
          console.log('[VideoLoading] Video at ' + progress + '% - not timing out despite duration');
          // For videos at high percentage, we'll keep waiting indefinitely
        }
      }, 1200000); // 20 minute timeout (increased from 10 minutes)

      return () => {
        console.log('[VideoLoading] Clearing timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [isLoading, isVideo, onTimeout, progress]);

  if (isLoading && isVideo) {
    const isKliginVideo = model === 'kligin-video';
    const hasProgress = typeof progress === 'number' && progress > 0;
    
    return (
      <div className="flex flex-col items-center justify-center p-6 my-4 bg-inventu-darker/20 rounded-lg border border-inventu-gray/20">
        <Loader2 className="h-12 w-12 mb-4 animate-spin text-inventu-blue" />
        <p className="text-base font-medium text-white">
          {isKliginVideo 
            ? "Kligin AI está processando seu vídeo..." 
            : "Gerando seu vídeo..."}
        </p>
        <p className="text-sm text-inventu-gray mt-2 text-center">
          {isKliginVideo
            ? "O processo pode levar entre 30 segundos e 20 minutos dependendo da complexidade. O processamento ocorre nos servidores da Kligin e estamos aguardando a resposta."
            : hasProgress && progress >= 95
              ? "O vídeo está em fase final de processamento. Aguarde a conclusão sem interrupções."
              : "Isso pode levar até 20 minutos para vídeos mais complexos. Por favor, aguarde."}
        </p>
        <div className="mt-4 h-2 w-full bg-inventu-darker rounded-full overflow-hidden">
          {hasProgress ? (
            <div 
              className="h-full bg-inventu-blue opacity-80 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          ) : (
            <div 
              className="h-full bg-inventu-blue opacity-80"
              style={{
                width: '30%',
                animation: 'progressAnimation 2s ease-in-out infinite'
              }}
            ></div>
          )}
        </div>
        {hasProgress && (
          <p className="text-xs text-inventu-gray mt-1">
            {progress >= 95 
              ? `${Math.round(progress)}% concluído - Finalizando processamento...` 
              : `${Math.round(progress)}% concluído`}
          </p>
        )}
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
