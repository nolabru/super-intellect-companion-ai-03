
import React from 'react';
import { MediaItem } from '@/types/gallery';
import GalleryMediaCard from './GalleryMediaCard';
import { AlertCircle, Image } from 'lucide-react';

type GalleryListProps = {
  media: MediaItem[];
  onDeleteItem: (id: string) => Promise<void>;
  loading?: boolean;
};

const GalleryList: React.FC<GalleryListProps> = ({ media, onDeleteItem, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] px-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-14 w-14 bg-inventu-gray/20 rounded-2xl mb-4"></div>
          <div className="h-4 bg-inventu-gray/20 rounded-full w-36 mb-2"></div>
          <div className="h-3 bg-inventu-gray/20 rounded-full w-28"></div>
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[40vh] px-6 py-10">
        <div className="bg-inventu-gray/5 rounded-full p-6 mb-6">
          <Image className="h-10 w-10 text-inventu-gray/40" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Nenhuma mídia encontrada</h3>
        <p className="max-w-md text-inventu-gray/70">
          Use o chat para gerar imagens, vídeos ou áudios e eles aparecerão aqui na sua galeria pessoal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4">
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
