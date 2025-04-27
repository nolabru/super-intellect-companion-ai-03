
import React from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { ChatMode } from '../ModeSelector';
import { useMediaLoading } from '@/hooks/useMediaLoading';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import ImageContent from './media/ImageContent';
import VideoContent from './media/VideoContent';
import AudioContent from './media/AudioContent';

interface MediaContainerProps {
  mediaUrl: string | null;
  mode: ChatMode;
  prompt?: string;
  modelId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({
  mediaUrl,
  mode,
  prompt = '',
  modelId
}) => {
  const { saveMediaToGallery, saving } = useMediaGallery();
  const {
    isLoading,
    hasError,
    handleMediaLoaded,
    handleMediaError,
    retryMediaLoad
  } = useMediaLoading(mediaUrl);

  const handleSaveToGallery = async () => {
    if (!mediaUrl) return;
    await saveMediaToGallery(mediaUrl, prompt, mode, modelId);
  };

  const openInNewTab = () => {
    if (mediaUrl) {
      window.open(mediaUrl, '_blank');
    }
  };

  if (hasError) {
    return (
      <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400 flex items-start">
          <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Não foi possível carregar a mídia. 
            {mode === 'video' && " Isso pode ocorrer porque o vídeo ainda está sendo processado."}
          </span>
        </p>
        <div className="mt-2 flex space-x-2">
          <button 
            onClick={retryMediaLoad}
            className="text-xs bg-red-900/40 hover:bg-red-900/60 text-white py-1 px-2 rounded flex items-center"
          >
            <RefreshCw size={12} className="mr-1" />
            Tentar novamente
          </button>
          {mediaUrl && (
            <button 
              onClick={openInNewTab}
              className="text-xs bg-inventu-darker/50 hover:bg-inventu-darker/80 text-white py-1 px-2 rounded flex items-center"
            >
              <ExternalLink size={12} className="mr-1" />
              Abrir link diretamente
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!mediaUrl) return null;

  switch (mode) {
    case 'image':
      return (
        <ImageContent
          src={mediaUrl}
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          onOpenInNewTab={openInNewTab}
          saving={saving}
        />
      );
    case 'video':
      return (
        <VideoContent
          src={mediaUrl}
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          onOpenInNewTab={openInNewTab}
          saving={saving}
        />
      );
    case 'audio':
      return (
        <AudioContent
          src={mediaUrl}
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          saving={saving}
        />
      );
    default:
      return null;
  }
};

export default MediaContainer;
