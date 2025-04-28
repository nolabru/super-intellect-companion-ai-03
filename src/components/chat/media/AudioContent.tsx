
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
          <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
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
            <Button
              variant={isMobile ? "default" : "ghost"}
              size={isMobile ? "default" : "sm"}
              className={isMobile 
                ? "w-full text-white bg-inventu-blue hover:bg-inventu-blue/90 py-3" 
                : "text-white text-xs flex items-center hover:text-white hover:bg-inventu-blue/20"
              }
              onClick={onSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={16} className={`${isMobile ? 'mr-2' : 'mr-1'} animate-spin`} />
              ) : (
                <Save size={isMobile ? 16 : 12} className={isMobile ? 'mr-2' : 'mr-1'} />
              )}
              Salvar na galeria
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioContent;
