
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
  taskId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ 
  mediaUrl, 
  mode, 
  prompt, 
  modelId,
  taskId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const { saveMediaToGallery, saving } = useMediaGallery();
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Set up polling for task status if taskId is provided
  useEffect(() => {
    if (!taskId) return;
    
    let pollInterval: number;
    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'apiframe-task-status', 
          { body: { taskId } }
        );
        
        if (error) {
          console.error('Error checking task status:', error);
          return;
        }
        
        if (data.progress) {
          setProgress(data.progress);
        }
        
        if (data.status === 'completed' && data.mediaUrl) {
          // Task completed, update the UI
          window.location.reload(); // Simple approach to refresh content
        }
      } catch (err) {
        console.error('Error polling task status:', err);
      }
    };
    
    // Poll every 10 seconds
    pollInterval = setInterval(pollStatus, 10000) as unknown as number;
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [taskId]);
  
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
    setError(null);
  };
  
  const handleMediaError = () => {
    setIsLoading(false);
    setError('Não foi possível carregar a mídia');
    
    // Implement exponential backoff retry for up to 3 attempts
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setError(null);
      }, delay);
    }
  };
  
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
  };
  
  if (error) {
    return (
      <MediaErrorDisplay 
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
        progress={progress}
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
