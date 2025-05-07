
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MediaItem, MediaFolder } from '@/types/gallery';
import { format } from 'date-fns';
import { Download, X, Trash, FolderIcon, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import MediaPreview from '@/components/media/MediaPreview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface MediaDetailsDialogProps {
  item: MediaItem;
  onClose?: () => void;
  onDelete?: () => void;
  folders?: MediaFolder[];
  onMove?: (mediaId: string, folderId: string | null) => Promise<boolean>;
}
const MediaDetailsDialog: React.FC<MediaDetailsDialogProps> = ({
  item,
  onClose,
  onDelete,
  folders = [],
  onMove
}) => {
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
  
  const handleOpenInNewTab = () => {
    const url = item.url || item.media_url;
    if (url) {
      window.open(url, '_blank');
    }
  };
  
  const handleMoveToFolder = async (folderId: string | null) => {
    if (onMove) {
      await onMove(item.id, folderId);
    }
  };
  const createdDate = new Date(item.created_at);
  const formattedDate = format(createdDate, 'dd/MM/yyyy HH:mm');
  const mediaType = item.type || item.media_type || 'image';
  const mediaUrl = item.url || item.media_url || '';
  return <Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="bg-inventu-dark border-inventu-gray/30 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between my-0 px-0 mx-0 py-[6px]">
          <DialogTitle className="text-white text-xl">Detalhes da mídia</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full my-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid gap-6 py-0">
          <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType as 'image' | 'video' | 'audio'} />

          <div className="space-y-2">
            
            {item.prompt && <div className="bg-inventu-darker p-3 rounded-md border border-inventu-gray/20">
                <p className="text-inventu-gray/90 mb-1 font-normal text-sm">prompt</p>
                <p className="text-sm text-white">{item.prompt}</p>
              </div>}
            <div className="flex flex-wrap gap-2 text-xs text-inventu-gray/70">
              <span>Criado em: {formattedDate}</span>
              {item.model_id && <span>• Modelo: {item.model_id}</span>}
              <span>• Tipo: {mediaType}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <TooltipProvider>
            <div className="flex gap-2">
              {onDelete && <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" onClick={onDelete}>
                      <Trash className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir mídia</p>
                  </TooltipContent>
                </Tooltip>}
              
              {onMove && folders && <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <FolderIcon className="h-4 w-4 mr-2" />
                          {item.folder_id ? folders.find(f => f.id === item.folder_id)?.name || 'Pasta' : 'Mover para pasta'}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mover para pasta</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent className="bg-inventu-dark text-white border-inventu-gray/30">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleMoveToFolder(null)}>
                      Raiz (sem pasta)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-inventu-gray/20" />
                    {folders.map(folder => <DropdownMenuItem key={folder.id} className="cursor-pointer" disabled={item.folder_id === folder.id} onClick={() => handleMoveToFolder(folder.id)}>
                        {folder.name}
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir em nova aba
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir em nova aba</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          
          <Button onClick={handleDownload} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default MediaDetailsDialog;
