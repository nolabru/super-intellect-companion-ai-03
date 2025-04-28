
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
        <div className={`mt-2 flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
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
          
          <Button
            variant={isMobile ? "outline" : "ghost"}
            size={isMobile ? "default" : "sm"}
            className={isMobile 
              ? "w-full text-white border-white/20 hover:bg-white/10 py-3" 
              : "text-white text-xs flex items-center hover:text-white hover:bg-white/10"
            }
            onClick={onOpenInNewTab}
          >
            <ExternalLink size={isMobile ? 16 : 12} className={isMobile ? 'mr-2' : 'mr-1'} />
            Abrir em nova aba
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageContent;
