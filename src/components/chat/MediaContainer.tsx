
import React, { useState } from 'react';
import { ChatMode } from '../ModeSelector';
import ImageContent from './media/ImageContent';
import AudioContent from './media/AudioContent';
import VideoContent from './media/VideoContent';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import MusicContent from './media/MusicContent';

interface MediaContainerProps {
  mediaUrl: string;
  mode: ChatMode;
  prompt: string;
  modelId?: string;
  audioType?: 'speech' | 'music';
  musicData?: {
    lyrics?: string;
    title?: string;
  };
}

const MediaContainer: React.FC<MediaContainerProps> = ({ 
  mediaUrl,
  mode,
  prompt,
  modelId,
  audioType = 'speech',
  musicData
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
    if (!mediaUrl || !prompt) return;

    try {
      await saveMediaToGallery(mediaUrl, prompt, mode, modelId);
    } catch (error) {
      console.error('Error saving to gallery:', error);
    }
  };
  
  const handleOpenInNewTab = () => {
    window.open(mediaUrl, '_blank');
  };
  
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
        />
      );
    case 'audio':
      // Para áudio do tipo música, renderizar o componente de música
      if (audioType === 'music') {
        return (
          <MusicContent
            src={mediaUrl}
            onLoad={handleLoad}
            onError={handleError}
            isLoading={isLoading}
            onSaveToGallery={handleSaveToGallery}
            saving={saving}
            lyrics={musicData?.lyrics}
            title={musicData?.title}
          />
        );
      }
      
      // Para áudio normal, renderizar o componente de áudio padrão
      return (
        <AudioContent 
          src={mediaUrl} 
          onLoad={handleLoad} 
          onError={handleError} 
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
