
import React, { useState } from 'react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import VideoGenerationRetry from './VideoGenerationRetry';
import VideoLoading from '../VideoLoading';

interface VideoContentProps {
  url?: string;
  isLoading?: boolean;
  taskId?: string;
  model?: string;
  onVideoReady?: (url: string) => void;
}

const VideoContent: React.FC<VideoContentProps> = ({
  url,
  isLoading = false,
  taskId,
  model = 'default',
  onVideoReady
}) => {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(url);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const { 
    checkTimedOutTask, 
    isCheckingStatus,
    currentTask
  } = useUnifiedMediaGeneration({
    onComplete: (mediaUrl) => {
      setVideoUrl(mediaUrl);
      setHasTimedOut(false);
      if (onVideoReady) onVideoReady(mediaUrl);
    }
  });

  const handleTimeout = () => {
    setHasTimedOut(true);
  };
  
  const handleRetry = async () => {
    await checkTimedOutTask();
  };

  if (!videoUrl && !isLoading && hasTimedOut) {
    return (
      <VideoGenerationRetry 
        onRetry={handleRetry} 
        isChecking={isCheckingStatus}
      />
    );
  }

  if (isLoading && !videoUrl) {
    return (
      <VideoLoading 
        isLoading={true} 
        isVideo={true} 
        model={model} 
        progress={currentTask?.progress}
        onTimeout={handleTimeout}
      />
    );
  }

  if (videoUrl) {
    return (
      <div className="w-full">
        <video 
          className="w-full rounded-lg"
          controls 
          src={videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return null;
};

export default VideoContent;
