
import React from 'react';
import { cn } from '@/lib/utils';

interface MediaPlayerProps {
  url: string;
  type?: 'image' | 'video' | 'audio';
  className?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ url, type = 'image', className }) => {
  if (!url) return null;

  if (type === 'image') {
    return (
      <img 
        src={url} 
        alt="Media content" 
        className={cn("w-full h-full object-contain", className)}
      />
    );
  }

  if (type === 'video') {
    return (
      <video 
        src={url} 
        controls 
        className={cn("w-full h-full", className)}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  if (type === 'audio') {
    return (
      <audio 
        src={url} 
        controls 
        className={cn("w-full", className)}
      >
        Your browser does not support the audio tag.
      </audio>
    );
  }

  return null;
};
