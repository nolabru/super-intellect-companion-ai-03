import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Image, GalleryHorizontal, Loader2, ImageOff, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import ConversationSidebar from '@/components/ConversationSidebar';
type MediaItem = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  created_at: string;
  title?: string;
};
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
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

        // Fetch tasks from apiframe_tasks table
        const {
          data: apiframeTasks,
          error: apiframeError
        } = await supabase.from('apiframe_tasks').select('id, media_url, media_type, created_at, prompt').eq('user_id', user.id).eq('status', 'completed').order('created_at', {
          ascending: false
        });
        if (apiframeError) {
          console.error('Error fetching APIframe tasks:', apiframeError);
          throw apiframeError;
        }
        const formattedMedia = (apiframeTasks || []).map(item => ({
          id: item.id,
          url: item.media_url || '',
          type: item.media_type as 'image' | 'video' | 'audio',
          created_at: item.created_at,
          title: item.prompt || undefined
        }));
        setMediaItems(formattedMedia);
      } catch (error) {
        console.error('Error fetching media:', error);
        toast.error('Não foi possível carregar sua galeria de mídia');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [user, navigate]);
  const handleDeleteMedia = async () => {
    if (!selectedItem) return;
    try {
      const {
        error
      } = await supabase.from('apiframe_tasks').delete().eq('id', selectedItem.id);
      if (error) {
        throw error;
      }
      setMediaItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
      setSelectedItem(null);
      setDeleteDialogOpen(false);
      toast.success('Arquivo excluído com sucesso');
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
        <MainLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title="Galeria de Mídias" showHeader={true}>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <GalleryHorizontal className="h-6 w-6 mr-2" />
                <h1 className="text-[24px] font-bold">Galeria de Mídias</h1>
              </div>
              
              {loading ? <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
                </div> : mediaItems.length === 0 ? <Card className="flex flex-col items-center justify-center h-64 bg-black/20 backdrop-blur-sm border-white/5">
                  <ImageOff className="h-12 w-12 mb-4 text-white/30" />
                  <p className="text-lg font-medium text-white/70">Nenhuma mídia encontrada</p>
                  <p className="text-sm text-white/50 mt-1 my-0">Use o assistente para gerar imagens, vídeos ou áudios</p>
                </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaItems.map(item => <Card key={item.id} className="relative group overflow-hidden bg-black/20 backdrop-blur-sm border-white/5">
                      <div className="aspect-square relative overflow-hidden" onClick={() => setSelectedItem(item)}>
                        {item.type === 'image' ? <img src={item.url} alt={item.title || 'Generated image'} className="w-full h-full object-cover" /> : item.type === 'video' ? <div className="w-full h-full bg-black/40 flex items-center justify-center">
                            <video src={item.url} className="w-full h-full object-cover" poster="/video-placeholder.png" />
                          </div> : <div className="w-full h-full bg-black/40 flex items-center justify-center">
                            <Image className="h-12 w-12 text-white/30" />
                          </div>}
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" className="h-9 w-9 bg-red-500/80 hover:bg-red-600" onClick={e => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setDeleteDialogOpen(true);
                    }}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{item.title || 'Mídia gerada'}</p>
                        <p className="text-xs text-white/50">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </Card>)}
                </div>}
            </div>
          </ScrollArea>
        </MainLayout>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMedia} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default MediaGallery;