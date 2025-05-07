
import React, { useState } from 'react';
import { MediaItem, MediaFolder } from '@/types/gallery';
import { TrashIcon, FolderIcon, ExternalLinkIcon, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
type GalleryMediaCardProps = {
  item: MediaItem;
  onDelete: (id: string) => Promise<void>;
  onMove?: (mediaId: string, folderId: string | null) => Promise<boolean>;
  folders?: MediaFolder[];
  onClick?: () => void;
};
const GalleryMediaCard: React.FC<GalleryMediaCardProps> = ({
  item,
  onDelete,
  onMove,
  folders = [],
  onClick
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleMoveToFolder = async (folderId: string | null) => {
    if (onMove) {
      await onMove(item.id, folderId);
    }
  };
  const handleDownload = () => {
    const url = item.url || item.media_url;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;

    // Get file extension from URL or use default based on media type
    const mediaType = item.type || item.media_type;
    const extension = mediaType === 'image' ? 'png' : mediaType === 'video' ? 'mp4' : 'mp3';

    // Generate filename with timestamp to make it unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const title = item.title || item.prompt || 'media';
    const safeTitle = title.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    link.download = `${safeTitle}-${timestamp}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getMediaContent = () => {
    const url = item.url || item.media_url;
    if (!url) return null;
    const mediaType = item.type || item.media_type;
    if (mediaType === 'image') {
      return <img src={url} alt={item.title || 'Media item'} className="absolute inset-0 w-full h-full object-cover rounded-t-md" />;
    } else if (mediaType === 'video') {
      return <video src={url} className="absolute inset-0 w-full h-full object-cover rounded-t-md" muted loop playsInline />;
    } else if (mediaType === 'audio') {
      return <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-inventu-card rounded-t-md">
          <div className="w-16 h-16 bg-inventu-blue/30 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-inventu-blue rounded-full"></div>
          </div>
        </div>;
    } else {
      return <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-inventu-card rounded-t-md">
          <div className="text-inventu-gray/50 text-xl">Arquivo não suportado</div>
        </div>;
    }
  };
  const createdDate = new Date(item.created_at);
  const formattedDate = format(createdDate, 'dd/MM/yyyy');
  return <div className="bg-inventu-card border border-inventu-gray/30 rounded-md overflow-hidden transition-all hover:border-inventu-gray/50 cursor-pointer" onClick={onClick}>
      <div className="relative aspect-video">
        {getMediaContent()}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-inventu-dark text-white border-inventu-gray/30 my-0 mx-0 py-[6px] px-[6px]">
              {/* 1. Abrir em nova aba */}
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(item.url || item.media_url, '_blank')}>
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </DropdownMenuItem>
              
              {/* 2. Mover para pasta */}
              {onMove && folders && <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <FolderIcon className="h-4 w-4 mr-2" />
                    Mover para pasta
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-inventu-dark text-white border-inventu-gray/30">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleMoveToFolder(null)}>
                        Raiz (sem pasta)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-inventu-gray/20" />
                      {folders.map(folder => <DropdownMenuItem key={folder.id} className="cursor-pointer" disabled={item.folder_id === folder.id} onClick={() => handleMoveToFolder(folder.id)}>
                          {folder.name}
                        </DropdownMenuItem>)}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>}
              
              
              
              {/* 3. Baixar - Moved up before Excluir */}
              <DropdownMenuItem className="cursor-pointer" onClick={e => {
              e.stopPropagation();
              handleDownload();
            }}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </DropdownMenuItem>
              
              
              
              {/* 4. Excluir - Moved down after Baixar */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onSelect={e => e.preventDefault()}>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-inventu-dark border-inventu-gray/30">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Excluir mídia</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-inventu-gray/30">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 focus:bg-red-600">
                      {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium truncate">
          {item.title || item.prompt || 'Sem título'}
        </div>
        <div className="text-xs text-inventu-gray/70 mt-1">
          {formattedDate}
        </div>
      </div>
    </div>;
};
export default GalleryMediaCard;
