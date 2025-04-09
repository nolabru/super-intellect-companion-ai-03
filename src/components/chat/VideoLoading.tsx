
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoLoadingProps {
  isLoading: boolean;
  isVideo: boolean;
  model: string;
  onTimeout?: () => void;
}

const VideoLoading: React.FC<VideoLoadingProps> = ({ 
  isLoading, 
  isVideo, 
  model,
  onTimeout 
}) => {
  // Add timeout effect for video loading
  useEffect(() => {
    if (isLoading && isVideo) {
      // Set a timeout to notify when loading exceeds the time limit
      const timeoutId = setTimeout(() => {
        console.log('Video loading timeout exceeded');
        if (onTimeout) {
          onTimeout();
        }
      }, 180000); // 3 minute timeout

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isVideo, onTimeout]);

  if (isLoading && isVideo) {
    const isKliginVideo = model === 'kligin-video';
    const isLumaVideo = model === 'luma-video';
    
    return (
      <div className="flex flex-col items-center justify-center p-6 my-4 bg-inventu-darker/20 rounded-lg border border-inventu-gray/20">
        <Loader2 className="h-12 w-12 mb-4 animate-spin text-inventu-blue" />
        <p className="text-base font-medium text-white">
          {isKliginVideo 
            ? "Kligin AI is processing your video..." 
            : isLumaVideo
            ? "Luma AI is processing your video request..."
            : "Generating your video..."}
        </p>
        <p className="text-sm text-inventu-gray mt-2 text-center">
          {isLumaVideo 
            ? "The process may take between 30 seconds and 2 minutes depending on complexity. We're using the official Luma SDK."
            : "This may take a moment. Please wait."}
        </p>
        <div className="mt-4 h-2 w-full bg-inventu-darker rounded-full overflow-hidden">
          <div 
            className="h-full bg-inventu-blue opacity-80"
            style={{
              width: '30%',
              animation: 'progressAnimation 2s ease-in-out infinite'
            }}
          ></div>
        </div>
        <style>
          {`
            @keyframes progressAnimation {
              0% {
                margin-left: -30%;
              }
              100% {
                margin-left: 100%;
              }
            }
          `}
        </style>
      </div>
    );
  }
  
  return null;
};

export default VideoLoading;
