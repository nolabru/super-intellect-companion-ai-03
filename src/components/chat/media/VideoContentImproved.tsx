
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Save, ExternalLink, Copy, RefreshCw, Link as LinkIcon } from 'lucide-react';
import VideoGenerationRetry from './VideoGenerationRetry';
import { toast } from 'sonner';
import { recoverVideo, registerRecoveredVideo, isVideoUrlValid } from '@/utils/videoRecoveryUtils';

// Create a simple VideoLoading component to fix the TypeScript error
const VideoLoading: React.FC = () => {
  return (
    <div className="w-full aspect-video rounded-lg bg-black/20 flex items-center justify-center">
      <RefreshCw className="h-6 w-6 text-white/50 animate-spin" />
    </div>
  );
};

interface VideoContentProps {
  src: string;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  isLoading?: boolean;
  onSaveToGallery?: () => void;
  onOpenInNewTab?: () => void;
  saving?: boolean;
  showUrlOnly?: boolean;
}

const VideoContentImproved: React.FC<VideoContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading = false,
  onSaveToGallery,
  onOpenInNewTab,
  saving = false,
  showUrlOnly = false
}) => {
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState<number>(0);
  const [timeoutDetected, setTimeoutDetected] = useState<boolean>(false);
  const [urlCopied, setUrlCopied] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recoveryTimerRef = useRef<number | null>(null);

  // Check if the video is valid on mount and when src changes
  useEffect(() => {
    const checkVideo = async () => {
      if (!src) return;
      
      try {
        const isValid = await isVideoUrlValid(src);
        setVideoReady(isValid);
        setVideoError(!isValid);
        
        // Reset recovery state if we have a valid video
        if (isValid) {
          setRecoveryAttempts(0);
          setTimeoutDetected(false);
          if (onLoad) onLoad();
        }
      } catch (err) {
        console.error('Error checking video validity:', err);
        setVideoError(true);
      }
    };
    
    checkVideo();
    
    // Clear any existing recovery attempts when src changes
    return () => {
      if (recoveryTimerRef.current) {
        window.clearTimeout(recoveryTimerRef.current);
      }
    };
  }, [src, onLoad]);

  const handleLoadSuccess = () => {
    setVideoReady(true);
    setVideoError(false);
    if (onLoad) onLoad();
  };

  const handleLoadError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video load error:', e);
    setVideoError(true);
    setVideoReady(false);
    if (onError) onError(e);
    
    // Check if this is a timeout-based error
    if (recoveryAttempts === 0) {
      setTimeoutDetected(true);
    }
  };

  const handleRecoverVideo = async () => {
    if (!src) return;
    
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);
    
    try {
      // Extract task ID from URL if possible
      const taskIdMatch = src.match(/\/([^\/]+)\.mp4$/);
      const taskId = taskIdMatch ? taskIdMatch[1] : '';
      
      let recoveredUrl = '';
      
      // Try direct url validation first
      const isValid = await isVideoUrlValid(src);
      if (isValid) {
        recoveredUrl = src;
        setVideoReady(true);
        setVideoError(false);
        toast.success('Vídeo verificado e recuperado com sucesso!');
      } else if (taskId) {
        // If direct URL validation fails and we have a task ID, try recovery
        const result = await recoverVideo(src, taskId);
        
        if (result.success && result.url) {
          recoveredUrl = result.url;
          setVideoReady(true);
          setVideoError(false);
          toast.success('Vídeo recuperado com sucesso!');
        } else {
          toast.error('Não foi possível recuperar o vídeo');
        }
      } else {
        toast.error('Falha ao recuperar vídeo: ID da tarefa não encontrado na URL');
      }
      
      // If recovery was successful, try to reload the video
      if (recoveredUrl && videoRef.current) {
        videoRef.current.src = recoveredUrl;
        videoRef.current.load();
      }
    } catch (err) {
      console.error('Error recovering video:', err);
      toast.error('Erro ao tentar recuperar o vídeo');
    } finally {
      setIsRecovering(false);
    }
  };

  const copyVideoUrl = () => {
    if (!src) return;
    
    navigator.clipboard.writeText(src)
      .then(() => {
        setUrlCopied(true);
        toast.success('URL do vídeo copiada para a área de transferência');
        
        // Reset copied status after 3 seconds
        setTimeout(() => setUrlCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
        toast.error('Falha ao copiar URL');
      });
  };

  // Set up auto-recovery if showing URL only
  useEffect(() => {
    if (showUrlOnly && videoError && recoveryAttempts < 3) {
      recoveryTimerRef.current = window.setTimeout(() => {
        handleRecoverVideo();
      }, 5000); // Auto-retry after 5 seconds
    }
    
    return () => {
      if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
    };
  }, [showUrlOnly, videoError, recoveryAttempts]);

  // URL-only view
  if (showUrlOnly) {
    return (
      <div className="w-full rounded-lg bg-black/5 backdrop-blur p-4 flex flex-col">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-sm font-medium">URL do Vídeo</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyVideoUrl}
              className="h-7 px-2"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              {urlCopied ? 'Copiado!' : 'Copiar'}
            </Button>
            {onOpenInNewTab && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenInNewTab}
                className="h-7 px-2"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Abrir
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center bg-black/10 rounded p-2 mb-2 overflow-x-auto">
          <code className="text-xs text-blue-300 whitespace-nowrap">{src}</code>
        </div>
        
        {videoError && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecoverVideo}
              disabled={isRecovering}
              className="w-full"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Verificando URL...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Verificar URL
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Regular video view
  return (
    <div className="w-full">
      {isLoading ? (
        <VideoLoading />
      ) : videoError || timeoutDetected ? (
        <VideoGenerationRetry
          onRetry={handleRecoverVideo}
          isChecking={isRecovering}
          attempts={recoveryAttempts}
          message={
            timeoutDetected
              ? "O vídeo está sendo gerado, mas está demorando mais do que o esperado. Você pode verificar novamente em alguns instantes."
              : "Não foi possível carregar o vídeo. Tente verificar novamente."
          }
          additionalContent={
            <div className="mt-4 w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/70">URL do vídeo:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyVideoUrl}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <div className="bg-black/20 rounded p-2 overflow-x-auto">
                <code className="text-xs text-blue-300 whitespace-nowrap">{src}</code>
              </div>
            </div>
          }
        />
      ) : (
        <div className="relative w-full">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black/40">
            <video
              ref={videoRef}
              src={src}
              className="w-full h-full object-contain"
              onLoadedData={handleLoadSuccess}
              onError={handleLoadError}
              controls
              preload="metadata"
            />
          </div>
          
          <div className="flex justify-between mt-2">
            {onSaveToGallery && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveToGallery}
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Salvar na Galeria
                  </>
                )}
              </Button>
            )}
            
            {onOpenInNewTab && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenInNewTab}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Abrir em Nova Aba
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoContentImproved;
