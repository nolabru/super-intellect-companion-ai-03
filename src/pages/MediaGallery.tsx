
import React, { useState, useEffect, useCallback } from 'react';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Estado para forçar recarregamento

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quando a página torna-se visível novamente, forçar recarga
        console.log('[MediaGallery] Página visível novamente, recarregando dados...');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Adicionar evento para mudança de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpar o listener quando o componente desmonta
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('[MediaGallery] Componente desmontado, limpando listeners');
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    console.log('[MediaGallery] Iniciando fetchMedia, refreshTrigger:', refreshTrigger);
    fetchMedia();
  }, [user, navigate, refreshTrigger]); // Adicionado refreshTrigger às dependências

  const fetchMedia = async () => {
    try {
      setLoading(true);
      console.log('[MediaGallery] Buscando mídia da galeria...');

      // Buscar da tabela media_gallery
      const {
        data: galleryItems,
        error: galleryError
      } = await supabase.from('media_gallery').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      
      if (galleryError) {
        console.error('[MediaGallery] Erro ao buscar galeria de mídia:', galleryError);
        throw galleryError;
      }

      console.log('[MediaGallery] Itens de galeria encontrados:', galleryItems?.length || 0);

      // Se não encontrar itens em media_gallery, tentar buscar de piapi_tasks
      if (!galleryItems || galleryItems.length === 0) {
        const {
          data: piapiTasks,
          error: piapiError
        } = await supabase.from('piapi_tasks').select('id, media_url, media_type, created_at, prompt').eq('status', 'completed').order('created_at', {
          ascending: false
        });
        
        if (piapiError) {
          console.error('[MediaGallery] Erro ao buscar tarefas PIAPI:', piapiError);
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
        
        console.log('[MediaGallery] Itens formatados de piapi_tasks:', formattedPiapiMedia.length);
        setMediaItems(formattedPiapiMedia);
      } else {
        // Formatar dados da tabela media_gallery
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
        
        console.log('[MediaGallery] Itens formatados de media_gallery:', formattedGalleryMedia.length);
        setMediaItems(formattedGalleryMedia);
      }
    } catch (error) {
      console.error('[MediaGallery] Erro ao buscar mídia:', error);
      toast.error('Não foi possível carregar sua galeria de mídia');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = useCallback(async (id: string) => {
    try {
      console.log('[MediaGallery] Iniciando exclusão de mídia com ID:', id);
      
      // Atualizar UI imediatamente removendo o item antes de fazer a operação
      setMediaItems(prevItems => prevItems.filter(item => item.id !== id));
      
      // Fechar o popup de detalhes se o item excluído estava selecionado
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      
      // Usar a função de exclusão do hook
      const success = await deleteMediaFromGallery(id);
      
      if (!success) {
        console.error('[MediaGallery] A função deleteMediaFromGallery retornou false');
        // Re-fetch para garantir que a UI está sincronizada com o banco de dados
        await fetchMedia();
      } else {
        console.log('[MediaGallery] Mídia excluída com sucesso');
        // Nada mais a fazer aqui, já atualizamos a UI preventivamente
      }
    } catch (error) {
      console.error('[MediaGallery] Erro ao excluir mídia:', error);
      toast.error('Erro ao excluir o arquivo');
      // Re-fetch para restaurar o estado consistente da UI
      await fetchMedia();
    }
  }, [deleteMediaFromGallery, selectedItem, fetchMedia]);

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
                <h1 className="text-[24px] font-bold px-[14px]">Galeria de Mídias</h1>
              </div>
              
              <GalleryList media={mediaItems} onDeleteItem={handleDeleteMedia} loading={loading} onItemClick={handleItemClick} selectedItem={selectedItem} onCloseDetails={() => setSelectedItem(null)} />
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
    </div>;
};

export default MediaGallery;
