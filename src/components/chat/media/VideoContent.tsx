
import React, { useState, useEffect } from 'react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import VideoGenerationRetry from './VideoGenerationRetry';
import VideoLoading from '../VideoLoading';
import { Button } from '@/components/ui/button';
import { Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isManuallyChecking, setIsManuallyChecking] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  
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
  
  // Enhanced continuous checking system for timed out videos
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (hasTimedOut && taskId && !videoUrl && checkAttempts < 10) {
      // Set initial checking state
      setIsManuallyChecking(true);
      
      // Initial check
      const doCheck = async () => {
        console.log(`[VideoContent] Checking timed out task ${taskId} (attempt ${checkAttempts + 1}/10)`);
        
        try {
          const success = await checkTimedOutTask();
          
          // If successful, no need for further checks
          if (success) {
            console.log('[VideoContent] Task completed successfully after check');
            return;
          }
          
          // Increment attempts counter
          setCheckAttempts(prev => prev + 1);
        } catch (error) {
          console.error('[VideoContent] Error during check:', error);
        } finally {
          setIsManuallyChecking(false);
        }
      };
      
      // Run initial check
      doCheck();
      
      // Set up periodic checks every 15 seconds
      intervalId = window.setInterval(async () => {
        // Only check if not already checking and still in timed out state
        if (!isManuallyChecking && !isCheckingStatus && hasTimedOut && !videoUrl) {
          setIsManuallyChecking(true);
          await doCheck();
        }
      }, 15000); // Check every 15 seconds
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [hasTimedOut, taskId, videoUrl, checkAttempts, checkTimedOutTask, isCheckingStatus, isManuallyChecking]);

  const handleTimeout = () => {
    setHasTimedOut(true);
    toast.info(
      "O vídeo está demorando mais que o esperado", 
      { description: "Estamos verificando automaticamente o progresso a cada 15 segundos" }
    );
  };
  
  const handleRetry = async () => {
    setIsManuallyChecking(true);
    try {
      const success = await checkTimedOutTask();
      if (success) {
        toast.success("Vídeo concluído com sucesso!");
      }
    } catch (error) {
      console.error('[VideoContent] Error during retry:', error);
      toast.error("Erro ao verificar o status do vídeo", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde"
      });
    } finally {
      setIsManuallyChecking(false);
    }
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
        isChecking={isCheckingStatus || isManuallyChecking}
        message="O tempo de geração do vídeo excedeu o limite. Estamos verificando automaticamente o status a cada 15 segundos."
        attempts={checkAttempts}
        autoRetry={true}
        autoRetryInterval={15000}
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
