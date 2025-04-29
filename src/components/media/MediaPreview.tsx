
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType
}) => {
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  
  const handleMediaLoaded = () => {
    setIsMediaLoading(false);
    setMediaError(false);
  };
  
  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };
  
  const retryMediaLoad = () => {
    setIsMediaLoading(true);
    setMediaError(false);
  };
  
  const openInNewTab = () => {
    window.open(mediaUrl, '_blank');
  };

  if (mediaError) {
    return (
      <div className="border rounded-md p-4 flex flex-col items-center justify-center space-y-2 bg-muted/20">
        <p className="text-sm text-muted-foreground">Failed to load {mediaType}</p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={retryMediaLoad}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  }

  if (mediaType === 'image') {
    return (
      <div className="border rounded-md overflow-hidden">
        {isMediaLoading && (
          <div className="w-full h-48 flex items-center justify-center bg-muted/20">
            <div className="animate-pulse">Loading image...</div>
          </div>
        )}
        <img
          src={mediaUrl}
          alt="Generated"
          className={`w-full h-auto object-contain ${isMediaLoading ? 'hidden' : ''}`}
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
        />
      </div>
    );
  }
  
  if (mediaType === 'video') {
    return (
      <div className="border rounded-md overflow-hidden">
        <AspectRatio ratio={16 / 9} className="bg-black">
          <video
            src={mediaUrl}
            controls
            className="w-full h-full object-contain"
            onLoadedData={handleMediaLoaded}
            onError={handleMediaError}
          />
        </AspectRatio>
        {isMediaLoading && (
          <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center bg-muted/20">
            <div className="animate-pulse">Loading video...</div>
          </div>
        )}
      </div>
    );
  }
  
  if (mediaType === 'audio') {
    return (
      <div className="border rounded-md overflow-hidden p-4">
        <audio
          src={mediaUrl}
          controls
          className="w-full"
          onLoadedData={handleMediaLoaded}
          onError={handleMediaError}
        />
        {isMediaLoading && (
          <div className="w-full h-12 flex items-center justify-center bg-muted/20 mt-2">
            <div className="animate-pulse">Loading audio...</div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default MediaPreview;
