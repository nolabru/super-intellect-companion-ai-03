
import React, { useState } from 'react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import VideoGenerationRetry from './VideoGenerationRetry';
import VideoLoading from '../VideoLoading';
import { Button } from '@/components/ui/button';
import { Save, ExternalLink } from 'lucide-react';

interface VideoContentProps {
  src?: string;
  isLoading?: boolean;
  taskId?: string;
  model?: string;
  onVideoReady?: (url: string) => void;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSaveToGallery?: () => Promise<void>;
  onOpenInNewTab?: () => void;
  saving?: boolean;
}

const VideoContent: React.FC<VideoContentProps> = ({
  src,
  isLoading = false,
  taskId,
  model = 'default',
  onVideoReady,
  onLoad,
  onError,
  onSaveToGallery,
  onOpenInNewTab,
  saving = false
}) => {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(src);
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
      if (onLoad) onLoad();
    }
  });

  const handleTimeout = () => {
    setHasTimedOut(true);
  };
  
  const handleRetry = async () => {
    await checkTimedOutTask();
  };

  const handleVideoLoad = () => {
    if (onLoad) onLoad();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (onError) onError(e);
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
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          Your browser does not support the video tag.
        </video>

        {(onSaveToGallery || onOpenInNewTab) && (
          <div className="flex items-center justify-end gap-2 mt-2">
            {onSaveToGallery && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveToGallery}
                disabled={saving}
                title="Salvar na galeria"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
            
            {onOpenInNewTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenInNewTab}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default VideoContent;
