
import React, { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import AudioLoading from '../AudioLoading';

interface AudioContentProps {
  src: string;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  isLoading: boolean;
  onSaveToGallery: () => void;
  onOpenInNewTab: () => void;
  saving: boolean;
}

const AudioContent: React.FC<AudioContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading,
  onSaveToGallery,
  onOpenInNewTab,
  saving
}) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return <AudioLoading />;
  }
  
  return (
    <div className="mt-2 relative overflow-hidden rounded-lg">
      <div className="p-4 bg-inventu-darker rounded-lg">
        <audio 
          src={src} 
          className="w-full" 
          controls
          onLoadedData={onLoad}
          onError={onError}
        />
      </div>
      
      <div className={`mt-2 flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
        <Button
          onClick={onSaveToGallery}
          className="flex items-center gap-1"
          size="sm"
          disabled={saving}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Salvar na galeria</span>
        </Button>
        
        <Button
          onClick={onOpenInNewTab}
          variant="outline"
          className="flex items-center gap-1"
          size="sm"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Abrir em nova aba</span>
        </Button>
      </div>
    </div>
  );
};

export default AudioContent;
