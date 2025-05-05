
import React, { useState } from 'react';
import { MediaItem } from '@/types/gallery';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AudioLines, Calendar, Image, MessageSquare, Video, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
type GalleryMediaCardProps = {
  item: MediaItem;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
};
const GalleryMediaCard: React.FC<GalleryMediaCardProps> = ({
  item,
  onDelete,
  isDeleting = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [localDeleting, setLocalDeleting] = useState(false);
  
  const handleMediaLoad = () => {
    setIsMediaLoading(false);
  };
  
  const handleMediaError = () => {
    setIsMediaLoading(false);
    setMediaError(true);
  };
  
  const handleDeleteMedia = async () => {
    if (localDeleting || isDeleting) return;
    
    try {
      setLocalDeleting(true);
      
      if (isOpen) {
        setIsOpen(false);
      }
      
      await onDelete(item.id);
    } catch (error) {
      console.error("Error in delete handler:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mídia",
        variant: "destructive"
      });
    } finally {
      setLocalDeleting(false);
    }
  };
  
  const getTypeIcon = () => {
    const mediaType = item.media_type || item.type;
    switch (mediaType) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-400" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-400" />;
      case 'audio':
        return <AudioLines className="h-5 w-5 text-green-400" />;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const renderMediaPreview = (small: boolean = false) => {
    const commonClasses = small ? "h-full w-full object-cover" : "max-h-96 max-w-full mx-auto";
    const mediaUrl = item.media_url || item.url;
    const mediaType = item.media_type || item.type;
    
    if (mediaError) {
      return <div className="flex items-center justify-center p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          Não foi possível carregar a mídia
        </div>;
    }
    
    switch (mediaType) {
      case 'image':
        return <div className={small ? "relative h-full w-full" : "relative"}>
            {isMediaLoading && <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>}
            <img src={mediaUrl} alt={item.prompt} className={commonClasses} onLoad={handleMediaLoad} onError={handleMediaError} />
          </div>;
      case 'video':
        return <div className={small ? "relative h-full w-full" : "relative"}>
            {isMediaLoading && <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>}
            <video src={mediaUrl} controls={!small} muted={true} className={commonClasses} onLoadedData={handleMediaLoad} onError={handleMediaError} autoPlay={false} preload="metadata" />
          </div>;
      case 'audio':
        return <div className={small ? "flex items-center justify-center h-full w-full" : ""}>
            {isMediaLoading && <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>}
            {small ? <AudioLines className="h-16 w-16 text-inventu-gray" /> : <audio src={mediaUrl} controls className="w-full" onLoadedData={handleMediaLoad} onError={handleMediaError} autoPlay={false} preload="metadata" />}
          </div>;
      default:
        return <div>Tipo de mídia não suportado</div>;
    }
  };
  
  const confirmDelete = () => {
    // Show a simple confirm dialog using the browser's native confirm dialog
    if (window.confirm("Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.")) {
      handleDeleteMedia();
    }
  };

  return <>
      <Card className="overflow-hidden bg-inventu-card border-inventu-gray/30 hover:border-inventu-gray/50 transition-colors">
        <div className="h-48 bg-inventu-darker cursor-pointer" onClick={() => setIsOpen(true)}>
          {renderMediaPreview(true)}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {getTypeIcon()}
              <span className="ml-1 text-sm text-white">
                {item.media_type === 'image' ? 'Imagem' : item.media_type === 'video' ? 'Vídeo' : 'Áudio'}
              </span>
            </div>
            <div className="flex items-center text-xs text-inventu-gray">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(item.created_at)}
            </div>
          </div>
          
          <div className="line-clamp-3 text-sm text-white break-words">
            {item.prompt}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-start py-[8px] px-[4px]">
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={confirmDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-inventu-blue/20" onClick={() => setIsOpen(true)}>
            Visualizar
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-inventu-card border-inventu-gray/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {getTypeIcon()}
              {item.media_type === 'image' ? 'Imagem' : item.media_type === 'video' ? 'Vídeo' : 'Áudio'}
            </DialogTitle>
            <DialogDescription className="text-inventu-gray flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(item.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            {renderMediaPreview()}
          </div>
          
          <div className="bg-inventu-darker p-4 rounded-lg mb-4">
            <div className="flex items-center text-inventu-gray mb-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              <h3 className="text-sm font-medium">Prompt</h3>
            </div>
            <p className="text-white text-sm break-words">{item.prompt}</p>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" size="sm" className="text-red-400 border-red-900/30 hover:bg-red-900/20 hover:text-red-300" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir mídia
            </Button>
            
            <Button variant="outline" size="sm" className="text-white border-inventu-gray/30 hover:bg-inventu-blue/20 hover:text-white" onClick={() => window.open(item.media_url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};

export default GalleryMediaCard;
