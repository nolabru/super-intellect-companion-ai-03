
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoLoadingProps {
  progress?: number;
  message?: string;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ 
  progress = 0, 
  message = 'Gerando vídeo...' 
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  
  // Simulate progress increasing if the original progress stays the same for too long
  useEffect(() => {
    if (progress >= 0) {
      setLocalProgress(progress);
    }
    
    let timeout: NodeJS.Timeout;
    
    // If progress is stuck, slowly increment it
    if (progress < 90) {
      timeout = setTimeout(() => {
        setLocalProgress(prev => Math.min(prev + 1, 95));
      }, 3000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [progress]);
  
  // Get an appropriate message based on progress
  const getMessage = () => {
    if (localProgress < 20) return 'Iniciando geração de vídeo...';
    if (localProgress < 40) return 'Criando frames iniciais...';
    if (localProgress < 60) return 'Processando sequência de vídeo...';
    if (localProgress < 80) return 'Aplicando efeitos visuais...';
    if (localProgress < 95) return 'Finalizando vídeo...';
    return 'Quase pronto...';
  };
  
  const displayMessage = message || getMessage();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-inventu-darker border border-inventu-gray/20">
      <div className="flex items-center mb-4">
        <Loader2 className="h-5 w-5 mr-2 animate-spin text-inventu-gray" />
        <span className="text-white font-medium">{displayMessage}</span>
      </div>
      
      <div className="w-full max-w-xs mb-2">
        <Progress value={localProgress} className="h-2 bg-inventu-gray/20" />
      </div>
      
      <p className="text-xs text-inventu-gray">
        {localProgress < 95 
          ? 'A geração de vídeo pode levar 1-3 minutos. Por favor, aguarde.' 
          : 'O vídeo está quase pronto. Aguarde mais alguns instantes.'}
      </p>
    </div>
  );
};

export default VideoLoading;
