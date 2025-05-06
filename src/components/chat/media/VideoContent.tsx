
import React, { useState, useEffect } from 'react';
import { ExternalLink, Save, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import VideoLoading from '../VideoLoading';
import { toast } from '@/hooks/toast';
import { Progress } from '@/components/ui/progress';

interface MediaActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

const MediaActionButton: React.FC<MediaActionButtonProps> = ({
  onClick,
  icon,
  label,
  variant = 'default',
  loading = false,
  disabled = false
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant === 'primary' ? 'default' : 'outline'}
      size="sm"
      disabled={loading || disabled}
      className="flex items-center gap-1"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      <span>{label}</span>
    </Button>
  );
};

interface VideoContentProps {
  src: string;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  isLoading: boolean;
  onSaveToGallery: () => void;
  onOpenInNewTab: () => void;
  saving: boolean;
  progress?: number;
  alreadySaved?: boolean;
}

const VideoContent: React.FC<VideoContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading,
  onSaveToGallery,
  onOpenInNewTab,
  saving,
  progress,
  alreadySaved = false
}) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Automatically retry loading the video if it fails initially
  // This helps with videos that might still be processing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loadError && retryCount < 3 && !videoReady) {
      console.log(`Trying to reload video (attempt ${retryCount + 1}/3)...`);
      timeoutId = setTimeout(() => {
        setLoadError(false);
        setRetryCount(prev => prev + 1);
      }, 3000); // retry after 3 seconds
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadError, retryCount, videoReady]);
  
  const handleVideoLoaded = () => {
    setVideoReady(true);
    setLoadError(false);
    onLoad();
    // Give a slight delay before enabling play
    setTimeout(() => setIsPlaying(true), 100);
  };
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("Video loading error:", e);
    setLoadError(true);
    onError(e);
  };
  
  // If still loading, show the loading component
  if (isLoading) {
    return <VideoLoading progress={progress} />;
  }
  
  return (
    <div className="mt-2 relative overflow-hidden rounded-lg">
      <div className="relative group">
        <video 
          key={`video-${src}-${retryCount}`} // Force reload on retry
          src={src} 
          className="max-w-full rounded-lg w-full max-h-80 object-contain bg-inventu-darker" 
          controls
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          playsInline
          autoPlay={false}
          loop
          poster={`${src}#t=0.001`}
        />
        
        {!isPlaying && !loadError && (
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer group-hover:bg-black/30 transition-all duration-200"
            onClick={() => {
              const videoElement = document.querySelector('video');
              if (videoElement) {
                videoElement.play();
                setIsPlaying(true);
              }
            }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1"></div>
            </div>
          </div>
        )}
        
        {loadError && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
            <p className="text-white mb-2">Erro ao carregar o vídeo</p>
            <p className="text-sm text-gray-300 mb-3">O vídeo pode ainda estar em processamento</p>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                setLoadError(false);
                setRetryCount(prev => prev + 1);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
      
      <div className={`mt-2 flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
        {alreadySaved ? (
          <div className="flex items-center text-green-500 mr-auto">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">Salvo na galeria</span>
          </div>
        ) : (
          <MediaActionButton
            onClick={onSaveToGallery}
            icon={<Save className="h-4 w-4" />}
            label="Salvar na galeria"
            variant="primary"
            loading={saving}
            disabled={alreadySaved}
          />
        )}
        
        <MediaActionButton
          onClick={onOpenInNewTab}
          icon={<ExternalLink className="h-4 w-4" />}
          label="Abrir em nova aba"
          variant="secondary"
        />
      </div>
    </div>
  );
};

export default VideoContent;
