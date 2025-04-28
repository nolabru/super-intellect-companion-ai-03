
import React from 'react';
import { Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MediaActionButton from './MediaActionButton';

interface AudioContentProps {
  src: string;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  isLoading: boolean;
  onSaveToGallery: () => void;
  saving: boolean;
}

const AudioContent: React.FC<AudioContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading,
  onSaveToGallery,
  saving
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="mt-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-6 bg-inventu-darker/50 rounded-lg">
          <div className="h-8 w-8 animate-spin text-inventu-gray border-2 border-inventu-gray border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <audio 
            src={src} 
            className="w-full" 
            controls
            onLoadedData={onLoad}
            onError={onError}
          />
          <div className={`mt-2 flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
            <MediaActionButton
              onClick={onSaveToGallery}
              icon={<Save />}
              label="Salvar na galeria"
              variant="primary"
              loading={saving}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AudioContent;
