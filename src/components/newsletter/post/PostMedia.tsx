
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { cn } from '@/lib/utils';

interface PostMediaProps {
  mediaUrl?: string | null;
  mediaType?: string | null;
  title: string;
}

export const PostMedia: React.FC<PostMediaProps> = ({
  mediaUrl,
  mediaType,
  title,
}) => {
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

  if (!mediaUrl) return null;

  // Ensure we have a valid media_type for the MediaPlayer
  const safeMediaType = (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio') 
    ? mediaType as "image" | "video" | "audio"
    : 'none';

  return (
    <>
      <div className="mt-3">
        {safeMediaType === 'image' ? (
          <div 
            className="relative aspect-video rounded-md overflow-hidden cursor-pointer"
            onClick={() => setMediaDialogOpen(true)}
          >
            <img 
              src={mediaUrl} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : safeMediaType === 'video' ? (
          <div 
            className="relative aspect-video rounded-md overflow-hidden cursor-pointer bg-black/40"
            onClick={() => setMediaDialogOpen(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge className="bg-inventu-blue">Vídeo</Badge>
            </div>
          </div>
        ) : safeMediaType === 'audio' ? (
          <div 
            className="relative h-16 rounded-md overflow-hidden cursor-pointer bg-black/40"
            onClick={() => setMediaDialogOpen(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge className="bg-inventu-blue">Áudio</Badge>
            </div>
          </div>
        ) : null}
      </div>

      {/* Media dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className={cn(
            "overflow-hidden",
            safeMediaType === 'image' || safeMediaType === 'video' ? "aspect-video" : "h-24"
          )}>
            <MediaPlayer 
              url={mediaUrl || ''} 
              type={safeMediaType} 
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
