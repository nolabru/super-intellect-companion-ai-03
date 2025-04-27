
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Save } from 'lucide-react';

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
  return (
    <div className="mt-2 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
        </div>
      )}
      <video 
        src={src} 
        controls 
        className="max-w-full rounded-lg max-h-80"
        onLoadedData={onLoad}
        onError={onError}
        autoPlay={false}
        preload="metadata"
        playsInline
        controlsList="nodownload"
      />
      {!isLoading && (
        <div className="mt-1 flex justify-end gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            className="text-xs flex items-center text-inventu-gray hover:text-white"
            onClick={onOpenInNewTab}
          >
            <ExternalLink size={12} className="mr-1" />
            Abrir em nova aba
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoContent;
