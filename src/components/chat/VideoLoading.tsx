
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoLoadingProps {
  progress?: number;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-inventu-darker border border-inventu-gray/20">
      <div className="flex items-center mb-2">
        <Loader2 className="h-5 w-5 mr-2 animate-spin text-inventu-gray" />
        <span className="text-white font-medium">Gerando vídeo...</span>
      </div>
      
      {progress !== undefined && (
        <div className="w-full mt-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-inventu-gray">{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLoading;
