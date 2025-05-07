
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useMediaFolders } from '@/hooks/useMediaFolders';

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
    deleteMediaFromGallery,
    deleting: deletingMedia
  } = useMediaGallery();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { folders, deleting: deletingFolder } = useMediaFolders();
  const isOperationInProgressRef = useRef(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When the page becomes visible again, force reload
        console.log('[MediaGallery] Page visible again, reloading data...');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Add event for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up listener when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('[MediaGallery] Component unmounted, cleaning up listeners');
    };
  }, []);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log('[MediaGallery] Starting fetchMedia, refreshTrigger:', refreshTrigger);
    fetchMedia();
  }, [user, navigate, refreshTrigger]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      console.log('[MediaGallery] Fetching media gallery...');

      // Fetch from media_gallery table
      const {
        data: galleryItems,
        error: galleryError
      } = await supabase.from('media_gallery').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      
      if (galleryError) {
        console.error('[MediaGallery] Error fetching media gallery:', galleryError);
        throw galleryError;
      }
      
      console.log('[MediaGallery] Gallery items found:', galleryItems?.length || 0);

      // If no items found in media_gallery, try to fetch from piapi_tasks
      if (!galleryItems || galleryItems.length === 0) {
        const {
          data: piapiTasks,
          error: piapiError
        } = await supabase.from('piapi_tasks').select('id, media_url, media_type, created_at, prompt').eq('status', 'completed').order('created_at', {
          ascending: false
        });
        
        if (piapiError) {
          console.error('[MediaGallery] Error fetching PIAPI tasks:', piapiError);
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
        
        console.log('[MediaGallery] Formatted items from piapi_tasks:', formattedPiapiMedia.length);
        setMediaItems(formattedPiapiMedia);
      } else {
        // Format data from media_gallery table
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
        
        console.log('[MediaGallery] Formatted items from media_gallery:', formattedGalleryMedia.length);
        setMediaItems(formattedGalleryMedia);
      }
    } catch (error) {
      console.error('[MediaGallery] Error fetching media:', error);
      toast.error('Não foi possível carregar sua galeria de mídia');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteMedia = useCallback(async (id: string) => {
    if (isOperationInProgressRef.current || deletingMedia || deletingFolder) {
      console.log('[MediaGallery] Operation already in progress, ignoring request');
      toast.error('Operação em andamento, aguarde...');
      return;
    }

    try {
      // Check if this media is already being deleted
      if (deletingIds.has(id)) {
        console.log('[MediaGallery] Deletion already in progress for ID:', id);
        return;
      }
      
      console.log('[MediaGallery] Starting media deletion with ID:', id);
      isOperationInProgressRef.current = true;

      // Add ID to list of ongoing deletions
      setDeletingIds(prev => new Set(prev).add(id));

      // Update UI immediately by removing the item before doing the operation
      setMediaItems(prevItems => prevItems.filter(item => item.id !== id));

      // Close details popup if the deleted item was selected
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }

      // Use the delete function from the hook
      const success = await deleteMediaFromGallery(id);
      
      if (!success) {
        console.error('[MediaGallery] deleteMediaFromGallery function returned false');
        // Re-fetch to ensure UI is synchronized with the database
        await fetchMedia();
      } else {
        console.log('[MediaGallery] Media deleted successfully');
      }
    } catch (error) {
      console.error('[MediaGallery] Error deleting media:', error);
      toast.error('Erro ao excluir o arquivo');
      // Re-fetch to restore consistent UI state
      await fetchMedia();
    } finally {
      // Remove ID from list of ongoing deletions with delay
      setTimeout(() => {
        setDeletingIds(prev => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        isOperationInProgressRef.current = false;
      }, 500);
    }
  }, [deleteMediaFromGallery, selectedItem, fetchMedia, deletingIds, deletingMedia, deletingFolder]);
  
  const handleItemClick = (item: MediaItem) => {
    if (!isOperationInProgressRef.current) {
      setSelectedItem(item);
    }
  };
  
  // Find current folder name
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const pageTitle = 'Galeria de Mídias';
    
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
        <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title={pageTitle} showHeader={true}>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-6 px-0 py-0">
              <div className="flex items-center mb-0 py-0 px-0 my-0 mx-0">
                <h1 className="px-0 text-xl font-medium">
                  Galeria de Mídias
                  {currentFolder && (
                    <span className="ml-2 text-inventu-gray/70">
                      &rsaquo; {currentFolder.name}
                    </span>
                  )}
                </h1>
              </div>
              
              <GalleryList 
                media={mediaItems} 
                onDeleteItem={handleDeleteMedia} 
                loading={loading} 
                onItemClick={handleItemClick} 
                selectedItem={selectedItem} 
                onCloseDetails={() => setSelectedItem(null)} 
                currentFolderId={currentFolderId}
                onFolderChange={setCurrentFolderId}
              />
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>;
};

export default MediaGallery;
