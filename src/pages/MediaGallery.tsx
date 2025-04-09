
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import GalleryList from '@/components/gallery/GalleryList';
import GalleryFilters from '@/components/gallery/GalleryFilters';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    mediaType: [],
    dateRange: { from: undefined, to: undefined },
  });
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserMedia();
    } else if (!authLoading) {
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

      setMedia(data || []);
      setFilteredMedia(data || []);
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

    // Filtrar por tipo de mídia
    if (filters.mediaType.length > 0) {
      filtered = filtered.filter(item => 
        filters.mediaType.includes(item.media_type)
      );
    }

    // Filtrar por data
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen ? (
          <div className="w-64 flex-shrink-0">
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        ) : (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden relative rounded-xl mx-4 my-2 bg-inventu-dark p-4">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white">Galeria de Mídias</h1>
              <p className="text-inventu-gray">Visualize e gerencie suas criações de IA</p>
            </div>
            
            <GalleryFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
            />
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-inventu-gray" />
              </div>
            ) : !user ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h2 className="text-xl font-medium text-white mb-2">Faça login para visualizar sua galeria</h2>
                  <p className="text-inventu-gray">Você precisa estar logado para acessar suas mídias</p>
                </div>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <h2 className="text-xl font-medium text-white mb-2">Nenhuma mídia encontrada</h2>
                  <p className="text-inventu-gray">
                    {media.length === 0 
                      ? "Você ainda não tem mídias geradas. Use o chat para criar novas mídias." 
                      : "Nenhuma mídia corresponde aos filtros selecionados."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <GalleryList media={filteredMedia} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
