
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
import { useTouchDevice } from '@/hooks/useTouchDevice';

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
  const isTouchDevice = useTouchDevice();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchMedia = async () => {
      try {
        setLoading(true);

        // Fetch from media_gallery table instead of apiframe_tasks
        const {
          data: galleryItems,
          error: galleryError
        } = await supabase.from('media_gallery').select('*').eq('user_id', user.id).order('created_at', {
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
            user_id: user.id
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
            user_id: item.user_id
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
    
    fetchMedia();
  }, [user, navigate]);
  
  const handleDeleteMedia = async (id: string) => {
    try {
      const itemToDelete = mediaItems.find(item => item.id === id);
      if (!itemToDelete) return;
      
      let success = false;

      // Identify which table the item is from based on properties
      if (itemToDelete.media_url) {
        // Item is from the media_gallery table
        const { error } = await supabase.from('media_gallery').delete().eq('id', id);
        if (error) throw error;
        success = true;
      } else {
        // Try to delete from the piapi_tasks table
        const { error } = await supabase.from('piapi_tasks').delete().eq('id', id);
        if (error) throw error;
        success = true;
      }
      
      if (success) {
        setMediaItems(prevItems => prevItems.filter(item => item.id !== id));
        toast.success('Arquivo excluído com sucesso');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erro ao excluir o arquivo');
    }
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
        <MainLayout 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
          title="Galeria de Mídias" 
          showHeader={true}
          isTouchDevice={isTouchDevice}
        >
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-6 py-0 px-[8px]">
              <div className="flex items-center mb-6 px-[16px] py-[10px]">
                <h1 className="text-[24px] font-bold">Galeria de Mídias</h1>
              </div>
              
              <GalleryList media={mediaItems} onDeleteItem={handleDeleteMedia} loading={loading} />
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>;
};

export default MediaGallery;
