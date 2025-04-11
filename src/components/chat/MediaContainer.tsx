import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChatMode } from '../ModeSelector';
import { useMediaGallery } from '@/hooks/useMediaGallery';

interface MediaContainerProps {
  mediaUrl: string | null;
  mode: ChatMode;
  onMediaLoaded: () => void;
  onMediaError: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => void;
  mediaError: boolean;
  isMediaLoading: boolean;
  retryMediaLoad: () => void;
  openMediaInNewTab: () => void;
  audioData?: string;
  prompt?: string;
  modelId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({
  mediaUrl,
  mode,
  onMediaLoaded,
  onMediaError,
  mediaError,
  isMediaLoading,
  retryMediaLoad,
  openMediaInNewTab,
  audioData,
  prompt = '',
  modelId
}) => {
  const isImage = mode === 'image';
  const isVideo = mode === 'video';
  const isAudio = mode === 'audio';
  const { saveMediaToGallery, saving } = useMediaGallery();
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (mediaError && isVideo && mediaUrl && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Attempt ${retryCount + 1} to load video`);
        retryMediaLoad();
        setRetryCount(prev => prev + 1);
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [mediaError, isVideo, mediaUrl, retryCount, retryMediaLoad]);

  useEffect(() => {
    if (mediaUrl) {
      setRetryCount(0);
    }
  }, [mediaUrl]);

  const handleSaveToGallery = async () => {
    if (!mediaUrl && !audioData) {
      toast.error('No media to save to gallery');
      return;
    }

    try {
      await saveMediaToGallery(
        mediaUrl || audioData || '',
        prompt,
        mode,
        modelId
      );

      toast.success('Media saved to gallery successfully');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      toast.error('Could not save media to gallery');
    }
  };
  
  if (mediaError) {
    return (
      <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400 flex items-start">
          <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Media could not be loaded. 
            {isVideo && " This may occur because the video is still being processed or due to temporary limitations."}
            {!isVideo && " This may occur due to API errors or temporary connection issues."}
          </span>
        </p>
        <div className="mt-2 flex space-x-2">
          <button 
            onClick={retryMediaLoad}
            className="text-xs bg-red-900/40 hover:bg-red-900/60 text-white py-1 px-2 rounded flex items-center"
          >
            <RefreshCw size={12} className="mr-1" />
            Retry
          </button>
          {mediaUrl && (
            <button 
              onClick={openMediaInNewTab}
              className="text-xs bg-inventu-darker/50 hover:bg-inventu-darker/80 text-white py-1 px-2 rounded flex items-center"
            >
              <ExternalLink size={12} className="mr-1" />
              Open link directly
            </button>
          )}
        </div>
      </div>
    );
  }
  
  console.log(`MediaContainer rendering with mode=${mode}, isMediaLoading=${isMediaLoading}, mediaUrl=${mediaUrl ? 'exists' : 'none'}`);
  
  if (isImage && mediaUrl) {
    return (
      <div className="mt-2 relative">
        {isMediaLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
          </div>
        )}
        <img 
          src={mediaUrl} 
          alt="Generated image" 
          className="max-w-full rounded-lg max-h-80 object-contain" 
          onLoad={onMediaLoaded}
          onError={onMediaError}
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Save to gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={openMediaInNewTab}
            >
              <ExternalLink size={12} className="mr-1" />
              Open in new tab
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  if (isVideo && mediaUrl) {
    return (
      <div className="mt-2 relative">
        {isMediaLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
          </div>
        )}
        <video 
          src={mediaUrl} 
          controls 
          className="max-w-full rounded-lg max-h-80"
          onLoadedData={onMediaLoaded}
          onError={onMediaError}
          autoPlay={false}
          preload="metadata"
          playsInline
          controlsList="nodownload"
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Save to gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={openMediaInNewTab}
            >
              <ExternalLink size={12} className="mr-1" />
              Open in new tab
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  if (isAudio && (audioData || mediaUrl)) {
    return (
      <div className="mt-2 relative">
        {isMediaLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
          </div>
        )}
        <audio 
          src={audioData || mediaUrl || ''} 
          controls 
          className="w-full"
          onLoadedData={onMediaLoaded}
          onError={onMediaError}
          autoPlay={false}
          preload="metadata"
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Save to gallery
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default MediaContainer;
