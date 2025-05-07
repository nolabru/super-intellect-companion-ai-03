
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType
}) => {
  const handleDownload = () => {
    // Create a fetch request to get the file as a blob
    fetch(mediaUrl).then(response => response.blob()).then(blob => {
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement('a');
      link.href = blobUrl;

      // Set filename based on media type
      const extension = mediaType === 'image' ? 'png' : mediaType === 'video' ? 'mp4' : 'mp3';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `generated-${mediaType}-${timestamp}.${extension}`;
      
      // Append to body and trigger click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Release the URL created earlier
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    }).catch(error => {
      console.error('Download failed:', error);
    });
  };

  return <div className="space-y-2">
      <div className="border rounded-md overflow-hidden bg-black/5">
        {mediaType === 'image' && <img src={mediaUrl} alt="Generated" className="w-full h-auto object-contain" />}
        
        {mediaType === 'video' && <video src={mediaUrl} controls className="w-full h-auto" />}
        
        {mediaType === 'audio' && <div className="p-4 flex justify-center">
            <audio src={mediaUrl} controls className="w-full" />
          </div>}
      </div>
      
      
    </div>;
};

export default MediaPreview;
