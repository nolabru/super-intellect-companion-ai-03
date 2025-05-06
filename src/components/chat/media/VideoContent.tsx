
import React from 'react';
import { ExternalLink, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MediaActionButton from './MediaActionButton';
import MediaLoading from './MediaLoading';

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
  
  return (
    <div className="mt-2 relative">
      {isLoading ? (
        <MediaLoading message="Carregando vídeo..." />
      ) : (
        <>
          <video 
            src={src} 
            className="max-w-full rounded-lg w-full max-h-80 object-contain" 
            controls
            onLoadedData={onLoad}
            onError={onError}
            playsInline
          />
          <div className={`mt-2 flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
            <MediaActionButton
              onClick={onSaveToGallery}
              icon={<Save />}
              label="Salvar na galeria"
              variant="primary"
              loading={saving}
            />
            
            <MediaActionButton
              onClick={onOpenInNewTab}
              icon={<ExternalLink />}
              label="Abrir em nova aba"
              variant="secondary"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default VideoContent;
