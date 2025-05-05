
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoLoadingProps {
  progress?: number;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ progress }) => {
  const showProgress = progress !== undefined && progress > 0;
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-inventu-darker border border-inventu-gray/20 space-y-3">
      <div className="flex items-center">
        <Loader2 className="h-5 w-5 mr-2 animate-spin text-inventu-gray" />
        <span className="text-white font-medium">Gerando vídeo...</span>
      </div>
      
      {showProgress && (
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center mt-1 text-inventu-gray">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};

export default VideoLoading;
