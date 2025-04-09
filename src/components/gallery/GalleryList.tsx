
import React from 'react';
import { MediaItem } from '@/pages/MediaGallery';
import GalleryMediaCard from './GalleryMediaCard';
import { AlertCircle } from 'lucide-react';

type GalleryListProps = {
  media: MediaItem[];
  onDeleteItem: (id: string) => void;
  loading?: boolean;
};

const GalleryList: React.FC<GalleryListProps> = ({ media, onDeleteItem, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-inventu-gray/20 rounded-full mb-4"></div>
          <div className="h-4 bg-inventu-gray/20 rounded w-32 mb-2"></div>
          <div className="h-3 bg-inventu-gray/20 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-64 text-inventu-gray/70">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhuma mídia encontrada</h3>
        <p className="max-w-md">
          Use o chat para gerar imagens, vídeos ou áudios e eles aparecerão aqui na sua galeria pessoal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map(item => (
        <GalleryMediaCard 
          key={item.id} 
          item={item} 
          onDelete={onDeleteItem} 
        />
      ))}
    </div>
  );
};

export default GalleryList;
