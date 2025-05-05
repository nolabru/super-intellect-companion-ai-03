
import React, { useState } from 'react';
import { ChatMode } from '../ModeSelector';
import ImageContent from './media/ImageContent';
import VideoContent from './media/VideoContent';
import AudioContent from './media/AudioContent';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import VideoLoading from './VideoLoading';

interface MediaContainerProps {
  mediaUrl: string;
  mode: ChatMode;
  prompt: string;
  modelId?: string;
  progress?: number;
  isGenerating?: boolean;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ 
  mediaUrl,
  mode,
  prompt,
  modelId,
  progress,
  isGenerating = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const { saveMediaToGallery, saving } = useMediaGallery();
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => {
    setIsLoading(false);
    console.error('Error loading media:', e);
  };
  
  const handleSaveToGallery = async () => {
    try {
      await saveMediaToGallery(mediaUrl, prompt, mode, modelId);
    } catch (error) {
      console.error('Error saving to gallery:', error);
    }
  };
  
  const handleOpenInNewTab = () => {
    window.open(mediaUrl, '_blank');
  };
  
  // Show loading state for video if it's still generating
  if (mode === 'video' && (isGenerating || (mediaUrl.includes('task_id=') && !mediaUrl.includes('.mp4')))) {
    return <VideoLoading progress={progress} />;
  }
  
  // Return the appropriate media component based on the mode
  switch (mode) {
    case 'image':
      return (
        <ImageContent 
          src={mediaUrl} 
          onLoad={handleLoad} 
          onError={handleError} 
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          onOpenInNewTab={handleOpenInNewTab}
          saving={saving}
        />
      );
    case 'video':
      return (
        <VideoContent 
          src={mediaUrl} 
          onLoad={handleLoad} 
          onError={handleError} 
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          onOpenInNewTab={handleOpenInNewTab}
          saving={saving}
          progress={progress}
        />
      );
    case 'audio':
      return (
        <AudioContent 
          src={mediaUrl} 
          onLoad={handleLoad} 
          onError={handleError} 
          isLoading={isLoading}
          onSaveToGallery={handleSaveToGallery}
          onOpenInNewTab={handleOpenInNewTab}
          saving={saving}
        />
      );
    default:
      return null;
  }
};

export default MediaContainer;
