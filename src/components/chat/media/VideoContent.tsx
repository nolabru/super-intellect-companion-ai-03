
import React, { useState } from 'react';
import { ExternalLink, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface MediaActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'primary' | 'secondary';
  loading?: boolean;
}

const MediaActionButton: React.FC<MediaActionButtonProps> = ({
  onClick,
  icon,
  label,
  variant = 'default',
  loading = false
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant === 'primary' ? 'default' : 'outline'}
      size="sm"
      disabled={loading}
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
}

const VideoContent: React.FC<VideoContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading,
  onSaveToGallery,
  onOpenInNewTab,
  saving
}) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="mt-2 relative overflow-hidden rounded-lg">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/70 z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin text-inventu-gray border-2 border-inventu-gray border-t-transparent rounded-full mb-2" />
            <span className="text-sm text-white">Carregando vídeo...</span>
          </div>
        </div>
      )}
      
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
          poster={isLoading ? undefined : `${src}#t=0.001`}
        />
        
        {!isLoading && !isPlaying && (
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
      
      {!isLoading && (
        <div className={`mt-2 flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
          <MediaActionButton
            onClick={onSaveToGallery}
            icon={<Save className="h-4 w-4" />}
            label="Salvar na galeria"
            variant="primary"
            loading={saving}
          />
          
          <MediaActionButton
            onClick={onOpenInNewTab}
            icon={<ExternalLink className="h-4 w-4" />}
            label="Abrir em nova aba"
            variant="secondary"
          />
        </div>
      )}
    </div>
  );
};

export default VideoContent;
