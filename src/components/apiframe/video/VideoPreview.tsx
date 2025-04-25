
import React from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPreviewProps {
  videoUrl: string | null;
  isLoading: boolean;
  mediaError: boolean;
  onRetry: () => void;
  onOpenInNewTab: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  isLoading,
  mediaError,
  onRetry,
  onOpenInNewTab
}) => {
  if (!videoUrl) return null;

  if (mediaError) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-600">Failed to load video</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenInNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden mt-4">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        <video 
          src={videoUrl} 
          controls 
          className="w-full h-auto" 
        />
      </div>
    </div>
  );
};

export default VideoPreview;
