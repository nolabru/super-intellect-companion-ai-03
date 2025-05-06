
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

export type GalleryFilters = {
  mediaType: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
};

const MediaGallery: React.FC = () => {
  const { user } = useAuth();
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

        // Fetch from media_gallery table instead of apiframe_tasks
        const { data: galleryItems, error: galleryError } = await supabase
          .from('media_gallery')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (galleryError) {
          console.error('Error fetching media gallery:', galleryError);
          throw galleryError;
        }

        // If no items found in media_gallery or we have few items, try to fetch from piapi_tasks
        if (!galleryItems || galleryItems.length === 0) {
          // Safely fetch from piapi_tasks without requiring user_id column
          const { data: piapiTasks, error: piapiError } = await supabase
            .from('piapi_tasks')
            .select('id, media_url, media_type, created_at, prompt, task_id')
            .eq('status', 'completed')
            .order('created_at', { ascending: false });
          
          if (piapiError) {
            console.error('Error fetching PIAPI tasks:', piapiError);
            // Continue execution instead of throwing - we still want to show any gallery items
          }
          
          // Safely process piapi tasks even if error occurred
          const formattedPiapiMedia = piapiTasks ? piapiTasks.map(item => ({
            id: item.id,
            url: item.media_url || '',
            media_url: item.media_url || '',
            type: item.media_type as 'image' | 'video' | 'audio',
            media_type: item.media_type as 'image' | 'video' | 'audio',
            created_at: item.created_at,
            prompt: item.prompt || '',
            user_id: user.id
          })) : [];
          
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
          
          // If gallery has few items, try augmenting with API tasks
          if (formattedGalleryMedia.length < 10) {
            try {
              // Check for completed apiframe tasks (safe version without requiring user_id column)
              const { data: apiframeTasks } = await supabase
                .from('apiframe_tasks')
                .select('task_id, media_url, media_type, created_at, prompt, result_url')
                .eq('status', 'finished')
                .order('created_at', { ascending: false });
                
              if (apiframeTasks && apiframeTasks.length > 0) {
                const formattedApiFrameMedia = apiframeTasks.map(item => ({
                  id: item.task_id, // Use task_id as id
                  url: item.media_url || item.result_url || '',
                  media_url: item.media_url || item.result_url || '',
                  type: item.media_type as 'image' | 'video' | 'audio',
                  media_type: item.media_type as 'image' | 'video' | 'audio',
                  created_at: item.created_at,
                  prompt: item.prompt || '',
                  user_id: user.id
                }));
                
                // Combine both sources, removing duplicates
                const existingUrls = new Set(formattedGalleryMedia.map(item => item.media_url));
                const uniqueApiFrameItems = formattedApiFrameMedia.filter(
                  item => item.media_url && !existingUrls.has(item.media_url)
                );
                
                setMediaItems([...formattedGalleryMedia, ...uniqueApiFrameItems]);
              } else {
                setMediaItems(formattedGalleryMedia);
              }
            } catch (apiframeError) {
              console.error('Error fetching APIFrame tasks:', apiframeError);
              setMediaItems(formattedGalleryMedia);
            }
          } else {
            setMediaItems(formattedGalleryMedia);
          }
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

      // Try to delete from media_gallery first
      const { error: galleryError } = await supabase
        .from('media_gallery')
        .delete()
        .eq('id', id);
        
      if (!galleryError) {
        success = true;
      } else {
        // If it fails, it might be a piapi_task or apiframe_task
        // Try piapi_tasks
        const { error: piapiError } = await supabase
          .from('piapi_tasks')
          .delete()
          .eq('id', id);
          
        if (!piapiError) {
          success = true;
        } else {
          // Try apiframe_tasks using task_id
          const { error: apiframeError } = await supabase
            .from('apiframe_tasks')
            .delete()
            .eq('task_id', id);
            
          if (!apiframeError) {
            success = true;
          }
        }
      }
      
      if (success) {
        setMediaItems(prevItems => prevItems.filter(item => item.id !== id));
        toast.success('Arquivo excluído com sucesso');
      } else {
        toast.error('Não foi possível excluir o arquivo');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erro ao excluir o arquivo');
    }
  };
  
  return (
    <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        >
          <div
            className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-screen w-full flex-col transition-all duration-300",
          !isMobile && sidebarOpen && "pl-64"
        )}
      >
        <MainLayout
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          title="Galeria de Mídias"
          showHeader={true}
        >
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-6 py-0 px-[8px]">
              <div className="flex items-center mb-6 px-[16px] py-[10px]">
                <h1 className="text-[24px] font-bold">Galeria de Mídias</h1>
              </div>
              
              <GalleryList
                media={mediaItems}
                onDeleteItem={handleDeleteMedia}
                loading={loading}
              />
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>
  );
};

export default MediaGallery;
