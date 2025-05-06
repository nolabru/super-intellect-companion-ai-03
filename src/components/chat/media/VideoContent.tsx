
import React, { useState } from 'react';
import { ExternalLink, Save, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import VideoLoading from '../VideoLoading';
import { toast } from '@/hooks/toast';

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
  
  if (isLoading) {
    return <VideoLoading progress={progress} />;
  }
  
  return (
    <div className="mt-2 relative overflow-hidden rounded-lg">
      <div className="relative group">
        <video 
          src={src} 
          className="max-w-full rounded-lg w-full max-h-80 object-contain bg-inventu-darker" 
          controls
          onLoadedData={() => {
            onLoad();
            setTimeout(() => setIsPlaying(true), 100);
          }}
          onError={onError}
          playsInline
          autoPlay={false}
          loop
          poster={`${src}#t=0.001`}
        />
        
        {!isPlaying && (
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
