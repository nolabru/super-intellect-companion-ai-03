import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2, Edit2, Check, X, MoreVertical, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { ConversationType } from '@/types/conversation';
import { useDrag } from 'react-dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FolderType {
  id: string;
  name: string;
  isOpen?: boolean;
}

interface ConversationItemProps {
  conversation: ConversationType;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onMove?: (folderId: string | null) => void;
  folders?: FolderType[];
  currentFolderId: string | null;
}

const CONVERSATION_TYPE = 'conversation';

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete,
  onRename,
  onMove,
  folders = [],
  currentFolderId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setNewTitle(conversation.title);
  }, [conversation.title]);

  const [{ isDragging }, drag] = useDrag({
    type: CONVERSATION_TYPE,
    item: { 
      id: conversation.id, 
      type: CONVERSATION_TYPE,
      currentFolderId: currentFolderId
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleRename = () => {
    if (newTitle.trim() === '') {
      toast({
        title: "Erro",
        description: "O título não pode estar vazio",
        variant: "destructive",
      });
      return;
    }
    
    onRename(newTitle);
    setIsEditing(false);
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

  const handleMoveToFolder = (folderId: string | null) => {
    if (onMove) {
      onMove(folderId);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center p-2 rounded-md ${isActive ? 'bg-inventu-gray/20 text-white' : 'text-inventu-gray'}`}>
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 bg-inventu-card border-inventu-gray/50"
            autoFocus
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-green-500 hover:text-white hover:bg-green-500/20"
            onClick={handleRename}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:text-white hover:bg-red-500/20"
            onClick={() => {
              setIsEditing(false);
              setNewTitle(conversation.title);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={drag}
        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
          isDragging ? 'opacity-50' : ''
        } ${
          isActive
            ? 'bg-inventu-gray/20 text-white'
            : 'hover:bg-inventu-gray/10 text-inventu-gray'
        }`}
        data-conversation-id={conversation.id}
        style={{ cursor: 'grab' }}
      >
        <div className="flex-1 min-w-0" onClick={onSelect}>
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4 flex-shrink-0" />
            <p className="truncate">{conversation.title}</p>
          </div>
          <p className="text-xs text-inventu-gray/70 truncate">
            {formatDate(conversation.updated_at)}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-inventu-gray/70 hover:text-white hover:bg-inventu-gray/20"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-inventu-card border-inventu-gray/30">
            <DropdownMenuItem 
              className="text-white hover:bg-inventu-gray/20 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
            
            {onMove && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-white hover:bg-inventu-gray/20 cursor-pointer">
                  <Folder className="mr-2 h-4 w-4" />
                  Mover para pasta
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-inventu-card border-inventu-gray/30">
                  <DropdownMenuItem 
                    className="text-white hover:bg-inventu-gray/20 cursor-pointer"
                    onClick={() => handleMoveToFolder(null)}
                    disabled={currentFolderId === null}
                  >
                    <span className="ml-2">Sem pasta</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-inventu-gray/30" />
                  {folders.map(folder => (
                    <DropdownMenuItem 
                      key={folder.id}
                      className="text-white hover:bg-inventu-gray/20 cursor-pointer"
                      onClick={() => handleMoveToFolder(folder.id)}
                      disabled={currentFolderId === folder.id}
                    >
                      <span className="ml-2">{folder.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            
            <DropdownMenuSeparator className="bg-inventu-gray/30" />
            <DropdownMenuItem 
              className="text-red-500 hover:bg-red-500/10 cursor-pointer"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-inventu-card border-inventu-gray/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
            <AlertDialogDescription className="text-inventu-gray">
              Tem certeza que deseja excluir a conversa "{conversation.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-inventu-gray/20 text-white hover:bg-inventu-gray/40 border-inventu-gray/40">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              onClick={onDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationItem;
