
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import GalleryList from '@/components/gallery/GalleryList';
import GalleryFilters from '@/components/gallery/GalleryFilters';
import { toast } from '@/components/ui/use-toast';
import { ChevronLeft, Image, Loader2, Plus } from 'lucide-react';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-media-query';

export type MediaItem = {
  id: string;
  created_at: string;
  media_url: string;
  prompt: string;
  media_type: 'image' | 'audio' | 'video';
  model_id: string | null;
  metadata: any;
};

export type GalleryFilters = {
  mediaType: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
};

const MediaGallery: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(!useIsMobile());
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    mediaType: ['image'],
    dateRange: { from: undefined, to: undefined },
  });
  
  const { user, loading: authLoading } = useAuth();
  const { deleteMediaFromGallery, deleting } = useMediaGallery();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  
  const dataFetchedRef = React.useRef(false);

  useEffect(() => {
    if (user && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchUserMedia();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    applyFilters();
  }, [filters, media]);

  const fetchUserMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMedia(data as MediaItem[] || []);
      setFilters({
        mediaType: ['image'],
        dateRange: { from: undefined, to: undefined },
      });
    } catch (error) {
      console.error('Erro ao buscar mídias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua galeria de mídias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...media];

    if (filters.mediaType.length === 0) {
      setFilters({
        ...filters,
        mediaType: ['image'],
      });
      return;
    }

    if (filters.mediaType.length > 0) {
      filtered = filtered.filter(item => 
        filters.mediaType.includes(item.media_type)
      );
    }

    if (filters.dateRange.from) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= new Date(filters.dateRange.from!)
      );
    }

    if (filters.dateRange.to) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) <= new Date(filters.dateRange.to!)
      );
    }

    setFilteredMedia(filtered);
  };

  const handleDeleteItem = async (id: string): Promise<void> => {
    try {
      if (deleting) return;
      
      const success = await deleteMediaFromGallery(id);
        
      if (success) {
        setMedia(prevMedia => prevMedia.filter(item => item.id !== id));
        setFilteredMedia(prevFiltered => prevFiltered.filter(item => item.id !== id));
        
        toast({
          title: "Sucesso",
          description: "Mídia excluída com sucesso",
        });
      } else {
        throw new Error("Falha ao excluir mídia");
      }
    } catch (error) {
      console.error('Erro ao excluir mídia:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mídia",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const goToChat = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {isDesktop && sidebarOpen && (
          <div className="w-64 flex-shrink-0">
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 bg-inventu-darker/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {(!isDesktop || !sidebarOpen) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 md:mr-3 text-inventu-gray hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                
                <div>
                  <h1 className="text-xl font-semibold text-white flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Galeria de Mídias
                  </h1>
                  <p className="text-sm text-inventu-gray hidden sm:block">
                    Visualize e gerencie suas criações de IA
                  </p>
                </div>
              </div>
              
              <Button
                variant="default"
                size="sm"
                className="rounded-full h-10 w-10 p-0 sm:w-auto sm:px-4"
                onClick={goToChat}
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Criar Nova</span>
              </Button>
            </div>
            
            <GalleryFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
            />
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-inventu-gray mb-3" />
                  <p className="text-inventu-gray text-sm">Carregando galeria...</p>
                </div>
              </div>
            ) : !user ? (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <h2 className="text-xl font-medium text-white mb-2">Faça login para visualizar sua galeria</h2>
                  <p className="text-inventu-gray">Você precisa estar logado para acessar suas mídias</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto pb-safe">
                <GalleryList 
                  media={filteredMedia} 
                  onDeleteItem={handleDeleteItem}
                />
              </div>
            )}
          </div>
        </div>
        
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40" onClick={toggleSidebar}>
            <div className="absolute left-0 top-0 h-full w-64" onClick={e => e.stopPropagation()}>
              <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
