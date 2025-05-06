
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import ImageContent from './media/ImageContent';
import VideoContent from './media/VideoContent';
import AudioContent from './media/AudioContent';
import MediaErrorDisplay from './media/MediaErrorDisplay';
import MediaLoading from './media/MediaLoading';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MediaContainerProps {
  mediaUrl: string;
  mode: ChatMode;
  prompt: string;
  modelId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ mediaUrl, mode, prompt, modelId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const { saveMediaToGallery, saving } = useMediaGallery();
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if this media is already saved in the gallery
    const checkIfSaved = async () => {
      if (!user || !mediaUrl) return;
      
      try {
        // Look for the media in the gallery by URL
        const { data, error } = await supabase
          .from('media_gallery')
          .select('id')
          .eq('media_url', mediaUrl)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setAlreadySaved(true);
        }
      } catch (err) {
        console.error('Error checking if media is saved:', err);
      }
    };
    
    checkIfSaved();
  }, [mediaUrl, user]);
  
  const handleSaveToGallery = async () => {
    if (alreadySaved) {
      toast.info("Esta mídia já foi salva na galeria");
      return;
    }
    
    try {
      await saveMediaToGallery(mediaUrl, prompt, mode, modelId);
      setAlreadySaved(true);
    } catch (error) {
      console.error('Error saving to gallery:', error);
      toast.error('Erro ao salvar na galeria');
    }
  };
  
  const handleOpenInNewTab = () => {
    window.open(mediaUrl, '_blank');
  };
  
  const handleMediaLoad = () => {
    setIsLoading(false);
  };
  
  const handleMediaError = () => {
    setIsLoading(false);
    setError('Não foi possível carregar a mídia');
  };
  
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Force reload by appending a timestamp to the URL
    // This technique helps bypass browser caching
    const reloadUrl = mediaUrl.includes('?') 
      ? `${mediaUrl}&t=${Date.now()}` 
      : `${mediaUrl}?t=${Date.now()}`;
    
    // For this example, we'll simulate reloading by setting a timeout
    setTimeout(() => {
      // Here you would normally update the mediaUrl with reloadUrl
      // but for demonstration purposes, we'll just reset the loading state
      setIsLoading(false);
    }, 1500);
  };
  
  if (error) {
    return (
      <MediaErrorDisplay 
        error={error} 
        onRetry={handleRetry}
        onOpenInNewTab={handleOpenInNewTab}
        mediaUrl={mediaUrl}
        mode={mode}
      />
    );
  }
  
  if (mode === 'image') {
    return (
      <ImageContent
        src={mediaUrl}
        onLoad={handleMediaLoad}
        onError={handleMediaError}
        isLoading={isLoading}
        onSaveToGallery={handleSaveToGallery}
        onOpenInNewTab={handleOpenInNewTab}
        saving={saving}
        alreadySaved={alreadySaved}
      />
    );
  } else if (mode === 'video') {
    return (
      <VideoContent
        src={mediaUrl}
        onLoad={handleMediaLoad}
        onError={handleMediaError}
        isLoading={isLoading}
        onSaveToGallery={handleSaveToGallery}
        onOpenInNewTab={handleOpenInNewTab}
        saving={saving}
      />
    );
  } else if (mode === 'audio') {
    return (
      <AudioContent
        src={mediaUrl}
        onLoad={handleMediaLoad}
        onError={handleMediaError}
        isLoading={isLoading}
        onSaveToGallery={handleSaveToGallery}
        onOpenInNewTab={handleOpenInNewTab}
        saving={saving}
      />
    );
  }
  
  return <MediaLoading />;
};

export default MediaContainer;
