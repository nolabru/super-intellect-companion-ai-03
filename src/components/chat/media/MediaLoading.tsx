
import React from 'react';

interface MediaLoadingProps {
  fullScreen?: boolean;
}

const MediaLoading: React.FC<MediaLoadingProps> = ({ fullScreen = false }) => {
  return (
    <div className={`${fullScreen ? 'absolute inset-0' : ''} flex items-center justify-center bg-inventu-darker/50 rounded-lg p-6`}>
      <div className="h-8 w-8 animate-spin text-inventu-gray border-2 border-inventu-gray border-t-transparent rounded-full" />
    </div>
  );
};

export default MediaLoading;
