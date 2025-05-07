
import React, { useState } from 'react';
import { MediaItem, MediaFolder } from '@/types/gallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Trash2, ExternalLink, FolderClosed, FolderOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GalleryMediaCardProps {
  item: MediaItem;
  onDelete: (id: string) => Promise<void>;
  onClick?: () => void;
  onMove?: (mediaId: string, folderId: string | null) => Promise<boolean>;
  folders?: MediaFolder[];
  disabled?: boolean;
}

const GalleryMediaCard: React.FC<GalleryMediaCardProps> = ({ 
  item, 
  onDelete, 
  onClick,
  onMove,
  folders = [],
  disabled = false
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const handleDelete = async () => {
    if (isDeleting || disabled) return;
    
    try {
      setIsDeleting(true);
      await onDelete(item.id);
      setConfirmDelete(false);
    } finally {
      // Add a delay before resetting to prevent UI flicker
      setTimeout(() => {
        setIsDeleting(false);
      }, 500);
    }
  };
  
  const handleMoveToFolder = async (folderId: string | null) => {
    if (!onMove || isMoving || disabled) return;
    
    try {
      setIsMoving(true);
      const success = await onMove(item.id, folderId);
      if (success) {
        setMoveFolderDialogOpen(false);
      }
    } finally {
      setTimeout(() => {
        setIsMoving(false);
      }, 500);
    }
  };

  const formattedDate = item.created_at 
    ? format(new Date(item.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })
    : '';

  // Format for image display
  const imageUrl = item.url || item.media_url || '';
  const isVideo = item.type === 'video' || item.media_type === 'video';
  const isAudio = item.type === 'audio' || item.media_type === 'audio';

  // Get folder name if this media is in a folder
  const currentFolder = folders.find(f => f.id === item.folder_id);
  
  return (
    <>
      <div className="group relative bg-inventu-card rounded-lg overflow-hidden border border-inventu-gray/10 hover:border-inventu-gray/30 transition-colors">
        {/* Media preview */}
        <div 
          className="aspect-square w-full overflow-hidden cursor-pointer" 
          onClick={disabled ? undefined : onClick}
        >
          {isVideo ? (
            <video 
              src={imageUrl} 
              className="w-full h-full object-cover"
              controls={false}
            />
          ) : isAudio ? (
            <div className="w-full h-full flex items-center justify-center bg-inventu-darker">
              <audio 
                src={imageUrl} 
                className="w-3/4" 
                controls
              />
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt={item.prompt || 'Media'} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        {/* Overlay with actions */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 bg-inventu-dark/70 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-inventu-dark border-inventu-gray/30 text-white">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => window.open(imageUrl, '_blank')}
                disabled={disabled}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </DropdownMenuItem>
              {folders.length > 0 && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setMoveFolderDialogOpen(true)}
                  disabled={disabled}
                >
                  <FolderClosed className="h-4 w-4 mr-2" />
                  Mover para pasta
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Folder indicator if in a folder */}
        {currentFolder && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs flex items-center">
            <FolderOpen className="h-3 w-3 mr-1" />
            <span className="truncate">{currentFolder.name}</span>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir mídia</DialogTitle>
            <DialogDescription className="text-inventu-gray/80">
              Esta ação é irreversível. Tem certeza que deseja excluir esta mídia?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} className="border-inventu-gray/30">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <span className="mr-2 h-4 w-4 animate-spin">◌</span>}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to folder dialog */}
      <Dialog open={moveFolderDialogOpen} onOpenChange={setMoveFolderDialogOpen}>
        <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Mover para pasta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant={item.folder_id === null ? "secondary" : "outline"}
              onClick={() => handleMoveToFolder(null)}
              disabled={isMoving}
              className="justify-start"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Raiz (Sem pasta)
            </Button>
            {folders.map(folder => (
              <Button 
                key={folder.id}
                variant={item.folder_id === folder.id ? "secondary" : "outline"}
                onClick={() => handleMoveToFolder(folder.id)}
                disabled={isMoving || item.folder_id === folder.id}
                className="justify-start"
              >
                <FolderClosed className="mr-2 h-4 w-4" />
                {folder.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveFolderDialogOpen(false)} className="border-inventu-gray/30">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GalleryMediaCard;
