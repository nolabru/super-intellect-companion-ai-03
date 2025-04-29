
import React from 'react';
import { ChatMode } from '../ModeSelector';
import { useMediaLoading } from '@/hooks/useMediaLoading';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import MediaPreview from '@/components/media/MediaPreview';

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

  if (!mediaUrl) return null;

  return (
    <MediaPreview
      mediaUrl={mediaUrl}
      mediaType={mode as 'image' | 'video' | 'audio'}
    />
  );
};

export default MediaContainer;
