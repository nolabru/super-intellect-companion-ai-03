
import React from 'react';
import { MediaItem } from '@/pages/MediaGallery';
import GalleryMediaCard from './GalleryMediaCard';

type GalleryListProps = {
  media: MediaItem[];
};

const GalleryList: React.FC<GalleryListProps> = ({ media }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map(item => (
        <GalleryMediaCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default GalleryList;
