
import React from 'react';
import { MediaItem } from '@/pages/MediaGallery';
import GalleryMediaCard from './GalleryMediaCard';

type GalleryListProps = {
  media: MediaItem[];
  onDeleteItem: (id: string) => void;
};

const GalleryList: React.FC<GalleryListProps> = ({ media, onDeleteItem }) => {
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
