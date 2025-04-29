
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import OptimizedMediaLoader from './OptimizedMediaLoader';

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
        <OptimizedMediaLoader
          src={mediaUrl}
          alt="Generated image"
          type="image"
          className="w-full h-auto object-contain"
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
          <OptimizedMediaLoader
            src={mediaUrl}
            type="video"
            className="w-full h-full object-contain"
            onLoad={handleMediaLoaded}
            onError={handleMediaError}
          />
        </AspectRatio>
      </div>
    );
  }
  
  if (mediaType === 'audio') {
    return (
      <div className="border rounded-md overflow-hidden p-4">
        <OptimizedMediaLoader
          src={mediaUrl}
          type="audio"
          className="w-full"
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
        />
      </div>
    );
  }
  
  return null;
};

export default MediaPreview;
