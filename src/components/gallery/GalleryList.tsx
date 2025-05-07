
import React, { useState } from 'react';
import { MediaItem, MediaFolder } from '@/types/gallery';
import GalleryMediaCard from './GalleryMediaCard';
import { AlertCircle, Image, FolderPlus, FolderOpen, FolderClosed, Trash2 } from 'lucide-react';
import { useMediaFolders } from '@/hooks/useMediaFolders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MediaDetailsDialog from './MediaDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { toast } from '@/hooks/use-toast';

type GalleryListProps = {
  media: MediaItem[];
  onDeleteItem: (id: string) => Promise<void>;
  loading?: boolean;
  onItemClick?: (item: MediaItem) => void;
  selectedItem?: MediaItem | null;
  onCloseDetails?: () => void;
};

const GalleryList: React.FC<GalleryListProps> = ({
  media,
  onDeleteItem,
  loading = false,
  onItemClick,
  selectedItem,
  onCloseDetails
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  
  const { 
    folders, 
    loading: foldersLoading, 
    createFolder, 
    deleteFolder, 
    moveMediaToFolder 
  } = useMediaFolders();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = await createFolder(newFolderName, currentFolderId);
    if (newFolder) {
      setNewFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const success = await deleteFolder(folderId);
    if (success) {
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      toast({
        title: "Pasta excluída",
        description: "A pasta foi excluída com sucesso.",
      });
    }
  };

  const handleMoveMedia = async (mediaId: string, folderId: string | null) => {
    return await moveMediaToFolder(mediaId, folderId);
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const parentFolders = currentFolderId 
    ? folders.filter(f => f.parent_folder_id === currentFolderId)
    : folders.filter(f => !f.parent_folder_id);

  const currentFolderMedia = currentFolderId
    ? media.filter(item => item.folder_id === currentFolderId)
    : media.filter(item => !item.folder_id);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[40vh] px-4">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-14 w-14 bg-inventu-gray/20 rounded-2xl mb-4"></div>
        <div className="h-4 bg-inventu-gray/20 rounded-full w-36 mb-2"></div>
        <div className="h-3 bg-inventu-gray/20 rounded-full w-28"></div>
      </div>
    </div>;
  }

  if (media.length === 0 && folders.length === 0) {
    return <div className="flex flex-col items-center justify-center text-center min-h-[70vh] px-6 my-0 py-[40px]">
      <div className="bg-inventu-gray/5 rounded-full p-6 mb-6">
        <Image className="h-10 w-10 text-inventu-gray/40" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Nenhuma mídia encontrada</h3>
      <p className="max-w-md text-inventu-gray/70">
        Use o chat para gerar imagens, vídeos ou áudios e eles aparecerão aqui na sua galeria pessoal.
      </p>
      <Button 
        variant="outline" 
        className="mt-4 border-inventu-gray/30"
        onClick={() => setNewFolderDialogOpen(true)}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        Criar pasta
      </Button>
    </div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4 px-3">
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                const currentFolder = folders.find(f => f.id === currentFolderId);
                setCurrentFolderId(currentFolder?.parent_folder_id || null);
              }}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
          )}
          <h2 className="text-lg font-medium">
            {currentFolderId ? currentFolder?.name : 'Todos os arquivos'}
          </h2>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="border-inventu-gray/30"
          onClick={() => setNewFolderDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nova pasta
        </Button>
      </div>
      
      {parentFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-3 mb-4">
          {parentFolders.map(folder => (
            <ContextMenu key={folder.id}>
              <ContextMenuTrigger>
                <div 
                  className="bg-inventu-card border border-inventu-gray/30 rounded-lg p-3 cursor-pointer hover:border-inventu-gray/50 transition-colors flex flex-col items-center"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <FolderClosed className="h-10 w-10 text-inventu-blue/70 mb-2" />
                  <p className="text-sm font-medium text-center truncate w-full">{folder.name}</p>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-inventu-dark border-inventu-gray/30 text-white">
                <ContextMenuItem 
                  className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
                  onClick={() => setConfirmDeleteFolderId(folder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir pasta
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
      
      {currentFolderMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 px-0 py-0">
          {currentFolderMedia.map(item => (
            <GalleryMediaCard 
              key={item.id} 
              item={item} 
              onDelete={onDeleteItem}
              onMove={handleMoveMedia}
              folders={folders}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center min-h-[30vh] px-6">
          <div className="bg-inventu-gray/5 rounded-full p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-inventu-gray/40" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Nenhum arquivo nesta pasta</h3>
          <p className="text-sm text-inventu-gray/70 max-w-md">
            Esta pasta está vazia. Você pode mover arquivos de outras pastas para cá.
          </p>
        </div>
      )}

      {/* Dialog for creating new folder */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Criar nova pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da pasta</Label>
              <Input 
                id="folder-name" 
                placeholder="Ex: Imagens favoritas"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-inventu-darker border-inventu-gray/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewFolderDialogOpen(false)}
              className="border-inventu-gray/30"
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deleting folders */}
      <AlertDialog 
        open={!!confirmDeleteFolderId} 
        onOpenChange={(open) => !open && setConfirmDeleteFolderId(null)}
      >
        <AlertDialogContent className="bg-inventu-dark border-inventu-gray/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir pasta</AlertDialogTitle>
            <AlertDialogDescription className="text-inventu-gray/80">
              Esta ação irá mover todos os arquivos da pasta para a raiz e excluir a pasta. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-inventu-darker text-white border-inventu-gray/30 hover:bg-inventu-gray/20"
              onClick={() => setConfirmDeleteFolderId(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90" 
              onClick={() => {
                if (confirmDeleteFolderId) {
                  handleDeleteFolder(confirmDeleteFolderId);
                  setConfirmDeleteFolderId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedItem && (
        <MediaDetailsDialog 
          item={selectedItem} 
          onClose={onCloseDetails} 
          onDelete={() => onDeleteItem(selectedItem.id)}
          folders={folders}
          onMove={handleMoveMedia}
        />
      )}
    </>
  );
};

export default GalleryList;
