
import React, { useState, useRef } from 'react';
import { MediaItem, MediaFolder } from '@/types/gallery';
import GalleryMediaCard from './GalleryMediaCard';
import { AlertCircle, Image, FolderPlus, FolderClosed, Trash2, MoreVertical, Pencil, ArrowLeft, Loader2 } from 'lucide-react';
import { useMediaFolders, CreateFolderParams } from '@/hooks/useMediaFolders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MediaDetailsDialog from './MediaDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

type GalleryListProps = {
  media: MediaItem[];
  onDeleteItem: (id: string) => Promise<void>;
  loading?: boolean;
  onItemClick?: (item: MediaItem) => void;
  selectedItem?: MediaItem | null;
  onCloseDetails?: () => void;
  currentFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
};

const GalleryList: React.FC<GalleryListProps> = ({
  media,
  onDeleteItem,
  loading = false,
  onItemClick,
  selectedItem,
  onCloseDetails,
  currentFolderId: propsFolderId,
  onFolderChange
}) => {
  // Use the prop value if provided, otherwise use local state
  const [localFolderId, setLocalFolderId] = useState<string | null>(null);
  const currentFolderId = propsFolderId !== undefined ? propsFolderId : localFolderId;
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingItemRef = useRef<string | null>(null);
  
  const setCurrentFolderId = (folderId: string | null) => {
    if (onFolderChange) {
      onFolderChange(folderId);
    } else {
      setLocalFolderId(folderId);
    }
  };
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<MediaFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  
  const {
    folders,
    loading: foldersLoading,
    deleting: deletingFolder,
    createFolder,
    deleteFolder,
    moveMediaToFolder,
    renameFolder
  } = useMediaFolders();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const params: CreateFolderParams = {
      name: newFolderName,
      parentId: currentFolderId
    };
    
    const newFolder = await createFolder(params);
    
    if (newFolder) {
      setNewFolderDialogOpen(false);
      setNewFolderName('');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (deletingFolder) {
      toast({
        title: "Operation in progress",
        description: "Please wait for the current operation to complete"
      });
      return;
    }
    
    try {
      setIsDeleting(true);
      const success = await deleteFolder(folderId);
      
      if (success) {
        if (currentFolderId === folderId) {
          // Reset folder ID with a small delay
          setTimeout(() => {
            setCurrentFolderId(null);
          }, 300);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteFolderId(null);
    }
  };

  const openRenameDialog = (folder: MediaFolder) => {
    setFolderToRename(folder);
    setRenameFolderName(folder.name);
    setRenameFolderDialogOpen(true);
  };
  
  const handleRenameFolder = async () => {
    if (!folderToRename || !renameFolderName.trim()) return;
    const success = await renameFolder(folderToRename.id, renameFolderName);
    if (success) {
      setRenameFolderDialogOpen(false);
      setFolderToRename(null);
      toast({
        title: "Pasta renomeada",
        description: "A pasta foi renomeada com sucesso."
      });
    }
  };

  const handleMediaDelete = async (mediaId: string) => {
    // Prevent multiple deletion operations on the same item
    if (isDeleting || deletingItemRef.current === mediaId) {
      toast({
        title: "Operation in progress",
        description: "Please wait for the current operation to complete"
      });
      return;
    }
    
    try {
      setIsDeleting(true);
      deletingItemRef.current = mediaId;
      
      // Close details if the deleted item was selected
      if (selectedItem?.id === mediaId) {
        onCloseDetails?.();
      }
      
      await onDeleteItem(mediaId);
    } finally {
      // Reset deletion state with a small delay
      setTimeout(() => {
        setIsDeleting(false);
        deletingItemRef.current = null;
      }, 500);
    }
  };
  
  const handleMoveMedia = async (mediaId: string, folderId: string | null) => {
    return await moveMediaToFolder(mediaId, folderId);
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const parentFolders = currentFolderId ? folders.filter(f => f.parent_folder_id === currentFolderId) : folders.filter(f => !f.parent_folder_id);
  const currentFolderMedia = currentFolderId ? media.filter(item => item.folder_id === currentFolderId) : media.filter(item => !item.folder_id);

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
      <Button variant="outline" className="mt-4 border-inventu-gray/30" onClick={() => setNewFolderDialogOpen(true)}>
        <FolderPlus className="h-4 w-4 mr-2" />
        Criar pasta
      </Button>
    </div>;
  }

  return <>
      <div className="flex justify-start items-center mt-3 py-0 px-0 mb-3">
        <div className="flex items-center gap-2">
          {currentFolderId && <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2" 
            onClick={() => {
              const currentFolder = folders.find(f => f.id === currentFolderId);
              setCurrentFolderId(currentFolder?.parent_folder_id || null);
            }}
            disabled={deletingFolder || isDeleting}
          >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>}
        </div>
        
        {!currentFolderId && <Button 
          variant="outline" 
          size="sm" 
          className="border-inventu-gray/30" 
          onClick={() => setNewFolderDialogOpen(true)}
          disabled={deletingFolder || isDeleting}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nova pasta
        </Button>}
      </div>
      
      {/* System Busy Indicator */}
      {(deletingFolder || isDeleting) && (
        <div className="bg-inventu-gray/10 text-white px-3 py-2 rounded-md mb-4 flex items-center">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span className="text-sm">Operação em andamento, aguarde...</span>
        </div>
      )}
      
      {parentFolders.length > 0 && <div className="grid grid-cols-6 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 px-0">
          {parentFolders.map(folder => <ContextMenu key={folder.id}>
              <ContextMenuTrigger>
                <div className="relative bg-inventu-card border border-inventu-gray/10 rounded-lg p-6 cursor-pointer hover:border-inventu-gray/70 transition-colors flex flex-col items-center group">
                  {/* Dropdown menu trigger */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingFolder || isDeleting}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-inventu-dark border-inventu-gray/30 text-white">
                        <DropdownMenuItem 
                          className="cursor-pointer" 
                          onClick={() => openRenameDialog(folder)}
                          disabled={deletingFolder || isDeleting}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive" 
                          onClick={() => setConfirmDeleteFolderId(folder.id)}
                          disabled={deletingFolder || isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Folder content that opens the folder when clicked */}
                  <div 
                    className="w-full flex flex-col items-center" 
                    onClick={() => !deletingFolder && !isDeleting && setCurrentFolderId(folder.id)}
                  >
                    <FolderClosed className="h-8 w-8 text-inventu-blue/100 mb-2" />
                    <p className="text-sm font-medium text-center truncate w-full">{folder.name}</p>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-inventu-dark border-inventu-gray/30 text-white">
                <ContextMenuItem 
                  className="cursor-pointer" 
                  onClick={() => openRenameDialog(folder)}
                  disabled={deletingFolder || isDeleting}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Renomear
                </ContextMenuItem>
                <ContextMenuItem 
                  className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive" 
                  onClick={() => setConfirmDeleteFolderId(folder.id)}
                  disabled={deletingFolder || isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>)}
        </div>}
      
      {currentFolderMedia.length > 0 ? <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-0 sm:p-0 px-0 py-0">
          {currentFolderMedia.map(item => 
            <GalleryMediaCard 
              key={item.id} 
              item={item} 
              onDelete={handleMediaDelete} 
              onMove={handleMoveMedia} 
              folders={folders} 
              onClick={() => !isDeleting && !deletingFolder && onItemClick?.(item)} 
              disabled={isDeleting || deletingFolder}
            />
          )}
        </div> : <div className="flex flex-col items-center justify-center text-center min-h-[60vh] p-6">
          <div className="bg-inventu-gray/5 rounded-full p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-inventu-gray/40" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Nenhum arquivo nesta pasta</h3>
          <p className="text-sm text-inventu-gray/70 max-w-md">
            Esta pasta está vazia. Você pode mover arquivos de outras pastas para cá.
          </p>
        </div>}

      {/* Dialog for creating new folder */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Criar nova pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da pasta</Label>
              <Input id="folder-name" placeholder="Ex: Imagens favoritas" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="bg-inventu-darker border-inventu-gray/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)} className="border-inventu-gray/30">
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for renaming folder */}
      <Dialog open={renameFolderDialogOpen} onOpenChange={setRenameFolderDialogOpen}>
        <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Renomear pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rename-folder-name">Novo nome da pasta</Label>
              <Input id="rename-folder-name" placeholder="Ex: Imagens favoritas" value={renameFolderName} onChange={e => setRenameFolderName(e.target.value)} className="bg-inventu-darker border-inventu-gray/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderDialogOpen(false)} className="border-inventu-gray/30">
              Cancelar
            </Button>
            <Button onClick={handleRenameFolder}>
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deleting folders */}
      <AlertDialog open={!!confirmDeleteFolderId} onOpenChange={open => !open && setConfirmDeleteFolderId(null)}>
        <AlertDialogContent className="bg-inventu-dark border-inventu-gray/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir pasta</AlertDialogTitle>
            <AlertDialogDescription className="text-inventu-gray/80">
              Esta ação irá mover todos os arquivos da pasta para a raiz e excluir a pasta. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-inventu-darker text-white border-inventu-gray/30 hover:bg-inventu-gray/20" onClick={() => setConfirmDeleteFolderId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90" 
              onClick={() => {
                if (confirmDeleteFolderId) {
                  handleDeleteFolder(confirmDeleteFolderId);
                }
              }}
              disabled={deletingFolder || isDeleting}
            >
              {deletingFolder ? <Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedItem && <MediaDetailsDialog item={selectedItem} onClose={onCloseDetails} onDelete={() => handleMediaDelete(selectedItem.id)} folders={folders} onMove={handleMoveMedia} />}
    </>;
};

export default GalleryList;
