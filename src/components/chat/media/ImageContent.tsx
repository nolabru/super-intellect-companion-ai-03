
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Save } from 'lucide-react';

interface ImageContentProps {
  src: string;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isLoading: boolean;
  onSaveToGallery: () => void;
  onOpenInNewTab: () => void;
  saving: boolean;
}

const ImageContent: React.FC<ImageContentProps> = ({
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
      <img 
        src={src} 
        alt="Imagem gerada" 
        className="max-w-full rounded-lg max-h-80 object-contain" 
        onLoad={onLoad}
        onError={onError}
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

export default ImageContent;
