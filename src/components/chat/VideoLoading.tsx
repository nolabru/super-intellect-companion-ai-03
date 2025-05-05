
import React from 'react';
import { Loader2 } from 'lucide-react';

const VideoLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-6 rounded-lg bg-inventu-darker border border-inventu-gray/20">
      <Loader2 className="h-5 w-5 mr-2 animate-spin text-inventu-gray" />
      <span className="text-white font-medium">Gerando vídeo...</span>
    </div>
  );
};

export default VideoLoading;
