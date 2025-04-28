
import React from 'react';
import { ChatMode } from '../ModeSelector';
import { useMediaLoading } from '@/hooks/useMediaLoading';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import ImageContent from './media/ImageContent';
import VideoContent from './media/VideoContent';
import AudioContent from './media/AudioContent';
import MediaErrorDisplay from './media/MediaErrorDisplay';

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
      <MediaErrorDisplay 
        onRetry={retryMediaLoad}
        onOpenInNewTab={openInNewTab}
        mediaUrl={mediaUrl}
        mode={mode}
      />
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
