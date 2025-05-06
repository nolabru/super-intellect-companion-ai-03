
import React, { useState } from 'react';
import { ExternalLink, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

interface ImageContentProps {
  src: string;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isLoading: boolean;
  onSaveToGallery: () => void;
  onOpenInNewTab: () => void;
  saving: boolean;
  alreadySaved?: boolean;
}

const ImageContent: React.FC<ImageContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading,
  onSaveToGallery,
  onOpenInNewTab,
  saving,
  alreadySaved = false
}) => {
  const isMobile = useIsMobile();
  const [saved, setSaved] = useState(alreadySaved);
  
  const handleSave = () => {
    if (saved) {
      toast.info("Esta imagem já foi salva na galeria");
      return;
    }
    
    onSaveToGallery();
    setSaved(true);
  };
  
  return (
    <div className="mt-2 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
          <div className="h-8 w-8 animate-spin text-inventu-gray border-2 border-inventu-gray border-t-transparent rounded-full" />
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
          <MediaActionButton
            onClick={handleSave}
            icon={<Save />}
            label={saved ? "Salva na galeria" : "Salvar na galeria"}
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
      )}
    </div>
  );
};

export default ImageContent;
