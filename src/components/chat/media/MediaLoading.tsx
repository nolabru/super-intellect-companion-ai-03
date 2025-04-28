
import React from 'react';

interface MediaLoadingProps {
  fullScreen?: boolean;
  message?: string;
}

const MediaLoading: React.FC<MediaLoadingProps> = ({ 
  fullScreen = false,
  message = "Carregando..." 
}) => {
  return (
    <div className={`${fullScreen ? 'absolute inset-0' : ''} flex flex-col items-center justify-center bg-inventu-darker/50 rounded-lg p-6`}>
      <div className="h-8 w-8 animate-spin text-inventu-gray border-2 border-inventu-gray border-t-transparent rounded-full" />
      {message && <p className="mt-2 text-sm text-white/70">{message}</p>}
    </div>
  );
};

export default MediaLoading;
