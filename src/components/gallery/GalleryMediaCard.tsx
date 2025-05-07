import React, { useState } from 'react';
import { MediaItem, MediaFolder } from '@/types/gallery';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  AudioLines, 
  Calendar, 
  Image, 
  MessageSquare, 
  Video, 
  ExternalLink, 
  Loader2, 
  Trash2, 
  FolderMinus,
  FolderClosed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

type GalleryMediaCardProps = {
  item: MediaItem;
  onDelete: (id: string) => Promise<void>;
  onMove?: (id: string, folderId: string | null) => Promise<boolean>;
  folders?: MediaFolder[];
  isDeleting?: boolean;
};

const GalleryMediaCard: React.FC<GalleryMediaCardProps> = ({
  item,
  onDelete,
  onMove,
  folders = [],
  isDeleting = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [localDeleting, setLocalDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
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
      toast.error("Não foi possível excluir a mídia");
    } finally {
      setLocalDeleting(false);
    }
  };
  
  const handleMoveToFolder = async (folderId: string | null) => {
    if (!onMove || isMoving) return;
    
    try {
      setIsMoving(true);
      const success = await onMove(item.id, folderId);
      if (!success) {
        throw new Error('Failed to move item');
      }
    } catch (error) {
      console.error("Error moving media:", error);
      toast.error("Não foi possível mover o arquivo");
    } finally {
      setIsMoving(false);
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
    <Card className="overflow-hidden bg-inventu-card border-inventu-gray/30 hover:border-inventu-gray/50 transition-colors mx-0 my-0 py-0 px-0">
      <div className="h-48 bg-inventu-darker cursor-pointer" onClick={() => setIsOpen(true)}>
        {renderMediaPreview(true)}
      </div>
      
      <CardContent className="px-[18px] py-[18px]">
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
      
      <CardFooter className="p-4 pt-0 flex justify-between py-[8px] mx-0 my-0 px-[18px]">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-inventu-gray hover:text-white px-2"
          onClick={() => setIsOpen(true)}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          <span className="text-xs">Abrir</span>
        </Button>
        
        <div className="flex gap-2">
          {onMove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-inventu-gray hover:text-white px-2"
                  disabled={isMoving}
                >
                  {isMoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderClosed className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs">Mover</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-inventu-darker border-inventu-gray/30">
                <DropdownMenuLabel>Mover para pasta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleMoveToFolder(null)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FolderMinus className="h-4 w-4" />
                  <span>Raiz (sem pasta)</span>
                </DropdownMenuItem>
                
                {folders.length > 0 ? (
                  folders.map(folder => (
                    <DropdownMenuItem 
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FolderClosed className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Nenhuma pasta disponível
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2"
            onClick={confirmDelete}
            disabled={localDeleting || isDeleting}
          >
            {localDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            <span className="text-xs">Excluir</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
    
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl bg-inventu-dark border-inventu-gray/30">
        <DialogHeader>
          <DialogTitle className="text-white">{item.title || "Visualizar mídia"}</DialogTitle>
          <DialogDescription>
            {item.created_at && (
              <div className="text-inventu-gray text-xs flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(item.created_at)}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-2">
          {renderMediaPreview()}
        </div>
        
        {item.prompt && (
          <div className="mt-2 text-sm text-white break-words bg-inventu-darker rounded p-3">
            <div className="flex items-center gap-1 mb-1 text-inventu-gray">
              <MessageSquare className="h-4 w-4" />
              <span>Prompt</span>
            </div>
            {item.prompt}
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          {onMove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  disabled={isMoving}
                  className="border-inventu-gray/30"
                >
                  {isMoving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FolderClosed className="h-4 w-4 mr-2" />
                  )}
                  Mover para pasta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-inventu-darker border-inventu-gray/30">
                <DropdownMenuItem 
                  onClick={() => handleMoveToFolder(null)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FolderMinus className="h-4 w-4" />
                  <span>Raiz (sem pasta)</span>
                </DropdownMenuItem>
                
                {folders.length > 0 ? (
                  folders.map(folder => (
                    <DropdownMenuItem 
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FolderClosed className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Nenhuma pasta disponível
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button 
            variant="destructive" 
            onClick={confirmDelete}
            disabled={localDeleting || isDeleting}
          >
            {localDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
};

export default GalleryMediaCard;
