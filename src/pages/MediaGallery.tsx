import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Image } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import ConversationSidebar from '@/components/ConversationSidebar';
import { MediaItem } from '@/types/gallery';
import GalleryList from '@/components/gallery/GalleryList';
import { useMediaGallery } from '@/hooks/useMediaGallery';
export type GalleryFilters = {
  mediaType: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
};
const MediaGallery: React.FC = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    deleteMediaFromGallery
  } = useMediaGallery();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMedia();
  }, [user, navigate]);
  const fetchMedia = async () => {
    try {
      setLoading(true);

      // Fetch from media_gallery table instead of apiframe_tasks
      const {
        data: galleryItems,
        error: galleryError
      } = await supabase.from('media_gallery').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (galleryError) {
        console.error('Error fetching media gallery:', galleryError);
        throw galleryError;
      }

      // If no items found in media_gallery, try to fetch from piapi_tasks
      if (!galleryItems || galleryItems.length === 0) {
        const {
          data: piapiTasks,
          error: piapiError
        } = await supabase.from('piapi_tasks').select('id, media_url, media_type, created_at, prompt').eq('status', 'completed').order('created_at', {
          ascending: false
        });
        if (piapiError) {
          console.error('Error fetching PIAPI tasks:', piapiError);
          throw piapiError;
        }
        const formattedPiapiMedia = (piapiTasks || []).map(item => ({
          id: item.id,
          url: item.media_url || '',
          media_url: item.media_url || '',
          type: item.media_type as 'image' | 'video' | 'audio',
          media_type: item.media_type as 'image' | 'video' | 'audio',
          created_at: item.created_at,
          prompt: item.prompt || '',
          user_id: user?.id || ''
        }));
        setMediaItems(formattedPiapiMedia);
      } else {
        // Format data from the media_gallery table
        const formattedGalleryMedia = galleryItems.map(item => ({
          id: item.id,
          url: item.media_url || '',
          media_url: item.media_url || '',
          type: item.media_type as 'image' | 'video' | 'audio',
          media_type: item.media_type as 'image' | 'video' | 'audio',
          created_at: item.created_at,
          prompt: item.prompt || '',
          title: item.prompt || undefined,
          user_id: item.user_id,
          folder_id: item.folder_id
        }));
        setMediaItems(formattedGalleryMedia);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Não foi possível carregar sua galeria de mídia');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteMedia = async (id: string) => {
    try {
      // Use the hook's delete function that properly handles both storage and DB
      const success = await deleteMediaFromGallery(id);
      if (success) {
        // Update UI immediately by filtering out the deleted item
        setMediaItems(prevItems => prevItems.filter(item => item.id !== id));
        toast.success('Arquivo excluído com sucesso');
        // Close the detail popup if the deleted item was selected
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      } else {
        throw new Error('Falha ao excluir o arquivo');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erro ao excluir o arquivo');
    }
  };
  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item);
  };
  return <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && <div className={cn("fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>}

      {isMobile && sidebarOpen && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" onClick={toggleSidebar}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark" onClick={e => e.stopPropagation()}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>}

      <div className={cn("flex min-h-screen w-full flex-col transition-all duration-300", !isMobile && sidebarOpen && "pl-64")}>
        <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title="Galeria de Mídias" showHeader={true}>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-6 px-[12px] py-[20px]">
              <div className="flex items-center mb-6 px-0 py-0">
                <h1 className="text-[24px] font-bold px-[11px]">Galeria de Mídias</h1>
              </div>
              
              <GalleryList media={mediaItems} onDeleteItem={handleDeleteMedia} loading={loading} onItemClick={handleItemClick} selectedItem={selectedItem} onCloseDetails={() => setSelectedItem(null)} />
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>;
};
export default MediaGallery;