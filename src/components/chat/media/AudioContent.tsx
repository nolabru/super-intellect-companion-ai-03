
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

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
  return (
    <div className="mt-2 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
        </div>
      )}
      <audio 
        src={src}
        controls 
        className="w-full"
        onLoadedData={onLoad}
        onError={onError}
        autoPlay={false}
        preload="metadata"
      />
      {!isLoading && (
        <div className="mt-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs flex items-center text-inventu-gray hover:text-white"
            onClick={onSaveToGallery}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={12} className="mr-1 animate-spin" />
            ) : (
              <Save size={12} className="mr-1" />
            )}
            Salvar na galeria
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioContent;
