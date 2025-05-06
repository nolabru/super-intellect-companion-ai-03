
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/toast';
import MainLayout from '@/components/layout/MainLayout';
import { Image } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import ConversationSidebar from '@/components/ConversationSidebar';
import { MediaItem } from '@/types/gallery';
import GalleryList from '@/components/gallery/GalleryList';

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

        // Fetch from unified media_gallery table first
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

        let allMediaItems: MediaItem[] = [];
        
        // Format data from the media_gallery table
        if (galleryItems && galleryItems.length > 0) {
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
          
          allMediaItems = [...formattedGalleryMedia];
        }
        
        // If enabled, fetch additional items from piapi_tasks that are not in gallery
        const {
          data: piapiTasks,
          error: piapiError
        } = await supabase.from('piapi_tasks')
          .select('id, media_url, media_type, created_at, prompt, status')
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        
        if (!piapiError && piapiTasks && piapiTasks.length > 0) {
          // Filter out items that might already be in the gallery
          const existingUrls = new Set(allMediaItems.map(item => item.media_url));
          
          const formattedPiapiMedia = piapiTasks
            .filter(item => item.media_url && !existingUrls.has(item.media_url))
            .map(item => ({
              id: item.id,
              url: item.media_url || '',
              media_url: item.media_url || '',
              type: item.media_type as 'image' | 'video' | 'audio',
              media_type: item.media_type as 'image' | 'video' | 'audio',
              created_at: item.created_at,
              prompt: item.prompt || '',
              user_id: user.id
            }));
          
          allMediaItems = [...allMediaItems, ...formattedPiapiMedia];
        }
        
        // If enabled, fetch additional items from apiframe_tasks that are not in gallery
        const {
          data: apiframeTasks,
          error: apiframeError
        } = await supabase.from('apiframe_tasks')
          .select('id, media_url, media_type, created_at, prompt, status')
          .eq('status', 'finished')
          .order('created_at', { ascending: false });
        
        if (!apiframeError && apiframeTasks && apiframeTasks.length > 0) {
          // Filter out items that might already be in the gallery
          const existingUrls = new Set(allMediaItems.map(item => item.media_url));
          
          const formattedApiframeMedia = apiframeTasks
            .filter(item => item.media_url && !existingUrls.has(item.media_url))
            .map(item => ({
              id: item.id,
              url: item.media_url || '',
              media_url: item.media_url || '',
              type: item.media_type as 'image' | 'video' | 'audio',
              media_type: item.media_type as 'image' | 'video' | 'audio',
              created_at: item.created_at,
              prompt: item.prompt || '',
              user_id: user.id
            }));
          
          allMediaItems = [...allMediaItems, ...formattedApiframeMedia];
        }
        
        // Sort all items by created_at
        allMediaItems.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order
        });
        
        setMediaItems(allMediaItems);
      } catch (error) {
        console.error('Error fetching media:', error);
        toast({
          title: "Erro",
          description: 'Não foi possível carregar sua galeria de mídia',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedia();
    
    // Setup realtime listeners for media_ready_events to auto-refresh the gallery
    const channel = supabase.channel('media-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'media_ready_events'
      }, payload => {
        console.log('Received media ready event:', payload);
        // Refresh the gallery when new media is ready
        fetchMedia();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);
  
  const handleDeleteMedia = async (id: string) => {
    try {
      const itemToDelete = mediaItems.find(item => item.id === id);
      if (!itemToDelete) return;
      
      let success = false;

      // First try to delete from media_gallery
      const { error: galleryError } = await supabase.from('media_gallery').delete().eq('id', id);
      
      if (!galleryError) {
        success = true;
      } else {
        // If not in media_gallery, try other tables based on the item source
        // Try to delete from the piapi_tasks table
        const { error: piapiError } = await supabase.from('piapi_tasks').delete().eq('id', id);
        if (!piapiError) {
          success = true;
        } else {
          // Try to delete from the apiframe_tasks table
          const { error: apiframeError } = await supabase.from('apiframe_tasks').delete().eq('id', id);
          if (!apiframeError) {
            success = true;
          }
        }
      }
      
      if (success) {
        setMediaItems(prevItems => prevItems.filter(item => item.id !== id));
        toast({
          title: "Sucesso",
          description: 'Arquivo excluído com sucesso'
        });
      } else {
        throw new Error("Não foi possível excluir o arquivo");
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Erro",
        description: 'Erro ao excluir o arquivo',
        variant: "destructive"
      });
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
        <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title="Galeria de Mídias" showHeader={true}>
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
