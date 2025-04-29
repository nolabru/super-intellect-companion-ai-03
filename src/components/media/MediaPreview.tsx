
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, Download, Share2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import OptimizedMediaLoader from './OptimizedMediaLoader';
import { useMediaTelemetry } from '@/hooks/useMediaTelemetry';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  modelId?: string;
  prompt?: string;
  allowDownload?: boolean;
  allowShare?: boolean;
  className?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType,
  modelId,
  prompt,
  allowDownload = true,
  allowShare = true,
  className = ""
}) => {
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const { trackMediaView } = useMediaTelemetry();
  
  // Track media view when component mounts
  useEffect(() => {
    if (mediaUrl && !isMediaLoading && !mediaError) {
      trackMediaView(mediaType, mediaUrl, modelId);
    }
  }, [mediaUrl, mediaType, modelId, isMediaLoading, mediaError, trackMediaView]);
  
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

  const handleDownload = () => {
    // Create anchor element
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = prompt ? 
      `${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${getFileExtension(mediaUrl, mediaType)}` :
      `media-${Date.now()}.${getFileExtension(mediaUrl, mediaType)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt || 'Shared media',
          text: prompt || 'Check out this media I generated',
          url: mediaUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(mediaUrl);
      // You might want to show a toast notification here
    }
  };

  // Helper to determine file extension from URL or media type
  const getFileExtension = (url: string, type: string) => {
    // Try to extract extension from URL
    const urlExtension = url.split('.').pop()?.split('?')[0];
    if (urlExtension && ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mp3', 'wav'].includes(urlExtension)) {
      return urlExtension;
    }
    
    // Fallback to type-based extension
    switch (type) {
      case 'image':
        return 'jpg';
      case 'video':
        return 'mp4';
      case 'audio':
        return 'mp3';
      default:
        return 'file';
    }
  };

  if (mediaError) {
    return (
      <div className={`border rounded-md p-4 flex flex-col items-center justify-center space-y-2 bg-muted/20 ${className}`}>
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
      <div className={`border rounded-md overflow-hidden ${className}`}>
        <div className="relative">
          <OptimizedMediaLoader
            src={mediaUrl}
            alt={prompt || "Generated image"}
            type="image"
            className="w-full h-auto object-contain"
            onLoad={handleMediaLoaded}
            onError={handleMediaError}
          />
          <div className="absolute bottom-0 right-0 p-2 flex space-x-1 bg-background/80 rounded-tl-md">
            {allowDownload && (
              <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
            )}
            {allowShare && (
              <Button variant="ghost" size="icon" onClick={handleShare} title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={openInNewTab} title="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (mediaType === 'video') {
    return (
      <div className={`border rounded-md overflow-hidden ${className}`}>
        <AspectRatio ratio={16 / 9} className="bg-black">
          <OptimizedMediaLoader
            src={mediaUrl}
            type="video"
            className="w-full h-full object-contain"
            onLoad={handleMediaLoaded}
            onError={handleMediaError}
          />
        </AspectRatio>
        <div className="p-2 flex justify-end space-x-1 bg-background/80">
          {allowDownload && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
          {allowShare && (
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
        </div>
      </div>
    );
  }
  
  if (mediaType === 'audio') {
    return (
      <div className={`border rounded-md overflow-hidden p-4 ${className}`}>
        <OptimizedMediaLoader
          src={mediaUrl}
          type="audio"
          className="w-full"
          onLoad={handleMediaLoaded}
          onError={handleMediaError}
        />
        <div className="mt-2 flex justify-end space-x-1">
          {allowDownload && (
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
          {allowShare && (
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

export default MediaPreview;
