
import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaPreviewProps {
  mediaUrl: string;
  mode: 'image' | 'video' | 'audio';
  isOpen: boolean;
  onClose: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  mediaUrl, 
  mode, 
  isOpen, 
  onClose 
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = `download-${Date.now()}.${mode === 'image' ? 'png' : mode === 'video' ? 'mp4' : 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full bg-inventu-dark border border-inventu-gray/20 rounded-xl overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-3 border-b border-inventu-gray/20">
          <h3 className="text-lg font-medium text-white">Visualizar {mode === 'image' ? 'Imagem' : mode === 'video' ? 'Vídeo' : 'Áudio'}</h3>
          <div className="flex items-center gap-2">
            {mode === 'image' && (
              <>
                <button 
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-5 w-5 text-white" />
                </button>
                <button 
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
              </>
            )}
            <button 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5 text-white" />
            </button>
            <button 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
          {mode === 'image' && (
            <img 
              src={mediaUrl} 
              alt="Imagem ampliada" 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          )}
          {mode === 'video' && (
            <video 
              src={mediaUrl} 
              controls 
              className="max-w-full max-h-full"
              autoPlay={false}
            />
          )}
          {mode === 'audio' && (
            <audio 
              src={mediaUrl} 
              controls 
              className="w-full"
              autoPlay={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
