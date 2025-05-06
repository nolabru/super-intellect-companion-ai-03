
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
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [isDbCheckActive, setIsDbCheckActive] = useState(false);
  const [persistentLoading, setPersistentLoading] = useState(false);
  
  const { 
    checkTimedOutTask, 
    isCheckingStatus,
    currentTask
  } = useUnifiedMediaGeneration({
    onComplete: (mediaUrl) => {
      setVideoUrl(mediaUrl);
      setHasTimedOut(false);
      setPersistentLoading(false);
      if (onVideoReady) onVideoReady(mediaUrl);
      if (onLoad) onLoad();
      
      // Reset checking states
      setIsManuallyChecking(false);
      setIsDbCheckActive(false);
      
      toast.success("Vídeo concluído com sucesso!");
    }
  });
  
  // Enhanced continuous checking system for timed out videos
  useEffect(() => {
    let intervalId: number | undefined;
    
    // Verificamos se o vídeo está carregando (taskId existe) e o progresso está em 95% ou mais
    if (taskId && !videoUrl && currentTask?.progress && currentTask.progress >= 95) {
      console.log(`[VideoContent] Detected high progress (${currentTask.progress}%) - activating persistent loading`);
      setPersistentLoading(true);
    }

    if ((hasTimedOut || persistentLoading) && taskId && !videoUrl && checkAttempts < 40) {
      // Set initial checking state
      setIsManuallyChecking(true);
      
      // Initial check
      const doCheck = async () => {
        console.log(`[VideoContent] Checking video status ${taskId} (attempt ${checkAttempts + 1}/40)`);
        setLastCheckTime(Date.now());
        
        try {
          const success = await checkTimedOutTask();
          
          // If successful, no need for further checks
          if (success) {
            console.log('[VideoContent] Task completed successfully after check');
            return;
          }
          
          // Increment attempts counter
          setCheckAttempts(prev => prev + 1);
          
          // If we've tried several times with the normal API, try a direct DB check
          if (checkAttempts > 5 && !isDbCheckActive) {
            setIsDbCheckActive(true);
            console.log('[VideoContent] Switching to direct DB check strategy');
          }
        } catch (error) {
          console.error('[VideoContent] Error during check:', error);
        } finally {
          setIsManuallyChecking(false);
        }
      };
      
      // Run initial check
      doCheck();
      
      // Set up periodic checks every 10 seconds
      intervalId = window.setInterval(async () => {
        // Only check if not already checking and still in timed out state
        if (!isManuallyChecking && !isCheckingStatus && (hasTimedOut || persistentLoading) && !videoUrl) {
          // Ensure we don't check too frequently (minimum 8 seconds between checks)
          const now = Date.now();
          if (now - lastCheckTime >= 8000) {
            setIsManuallyChecking(true);
            await doCheck();
          }
        }
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [hasTimedOut, taskId, videoUrl, checkAttempts, checkTimedOutTask, isCheckingStatus, 
      isManuallyChecking, lastCheckTime, isDbCheckActive, persistentLoading, currentTask]);

  // Additional effect to monitor progress and prevent premature timeout for videos at high progress
  useEffect(() => {
    if (currentTask?.progress && currentTask.progress >= 95 && isLoading) {
      console.log(`[VideoContent] Progress at ${currentTask.progress}% - activating persistent mode`);
      setPersistentLoading(true);
    }
  }, [currentTask?.progress, isLoading]);

  const handleTimeout = () => {
    // Only timeout if we're not already in persistent loading mode
    if (!persistentLoading) {
      setHasTimedOut(true);
      toast.info(
        "O vídeo está demorando mais que o esperado", 
        { description: "Estamos verificando automaticamente o progresso a cada 10 segundos" }
      );
    } else {
      console.log('[VideoContent] Timeout ignored due to high progress persistent mode');
    }
  };
  
  const handleRetry = async () => {
    setIsManuallyChecking(true);
    try {
      // Log extra info for debugging
      console.log(`[VideoContent] Manual retry triggered for task ${taskId}`);
      console.log(`[VideoContent] Current attempts: ${checkAttempts}`);
      
      const success = await checkTimedOutTask();
      if (success) {
        toast.success("Vídeo concluído com sucesso!");
      } else {
        toast.info("Vídeo ainda em processamento", { 
          description: "Continuaremos verificando automaticamente"
        });
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

  if (!videoUrl && !isLoading && (hasTimedOut || persistentLoading)) {
    return (
      <VideoGenerationRetry 
        onRetry={handleRetry}
        isChecking={isCheckingStatus || isManuallyChecking}
        message={persistentLoading 
          ? "O vídeo está em fase final de processamento (95% ou mais). Estamos verificando automaticamente o status a cada 10 segundos."
          : "O tempo de geração do vídeo excedeu o limite. Estamos verificando automaticamente o status a cada 10 segundos."
        }
        attempts={checkAttempts}
        autoRetry={true}
        autoRetryInterval={10000}
      />
    );
  }

  if ((isLoading || persistentLoading) && !videoUrl) {
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
