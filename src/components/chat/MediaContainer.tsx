
import React, { useState } from 'react';
import { ChatMode } from '../ModeSelector';
import ImageContent from './media/ImageContent';
import AudioContent from './media/AudioContent';
import { useMediaGallery } from '@/hooks/useMediaGallery';

interface MediaContainerProps {
  mediaUrl: string;
  mode: ChatMode;
  prompt: string;
  modelId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ 
  mediaUrl,
  mode,
  prompt,
  modelId
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
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <video
              src={mediaUrl}
              controls
              className="h-full w-full"
              onLoadedData={handleLoad}
              onError={handleError}
            />
          </div>
          {!isLoading && (
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1 rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
              >
                Abrir em nova aba
              </button>
              <button
                onClick={handleSaveToGallery}
                disabled={saving}
                className="flex items-center gap-1 rounded bg-indigo-700 px-3 py-1.5 text-sm text-white hover:bg-indigo-600 disabled:bg-indigo-900"
              >
                {saving ? 'Salvando...' : 'Salvar na galeria'}
              </button>
            </div>
          )}
        </div>
      );
    case 'audio':
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
