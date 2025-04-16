
import React, { useState, useMemo } from 'react';
import { ConversationType } from '@/types/conversation';
import ConversationItem from './ConversationItem';
import { Loader2, FolderPlus, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useDrop } from 'react-dnd';

interface FolderType {
  id: string;
  name: string;
  isOpen?: boolean;
}

interface ConversationListProps {
  conversations: ConversationType[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isUserLoggedIn: boolean;
  isLoading?: boolean;
  folders?: FolderType[];
  onCreateFolder?: (name: string) => void;
  onRenameFolder?: (id: string, newName: string) => void;
  onDeleteFolder?: (id: string) => void;
  onMoveConversation?: (conversationId: string, folderId: string | null) => void;
  conversationFolders?: Record<string, string | null>;
}

interface DragItem {
  type: string;
  id: string;
  currentFolderId: string | null;
}

const CONVERSATION_TYPE = 'conversation';

// Custom hook to create dropTargets outside of render
const useDropTargets = (folders: FolderType[], onMoveConversation: (conversationId: string, folderId: string | null) => void) => {
  const rootDropTarget = useDrop({
    accept: CONVERSATION_TYPE,
    drop: (item: DragItem) => {
      if (item.currentFolderId !== null) {
        onMoveConversation(item.id, null);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Create a map of folder drop targets
  const folderDropTargets = useMemo(() => {
    const targets: Record<string, ReturnType<typeof useDrop>> = {};
    
    folders.forEach(folder => {
      targets[folder.id] = useDrop({
        accept: CONVERSATION_TYPE,
        drop: (item: DragItem) => {
          if (item.currentFolderId !== folder.id) {
            onMoveConversation(item.id, folder.id);
          }
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
        }),
      });
    });
    
    return targets;
  }, [folders, onMoveConversation]);

  return { rootDropTarget, folderDropTargets };
};

const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  isUserLoggedIn,
  isLoading = false,
  folders = [],
  onCreateFolder = () => {},
  onRenameFolder = () => {},
  onDeleteFolder = () => {},
  onMoveConversation = () => {},
  conversationFolders = {}
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Use our custom hook to create all drop targets outside of render
  const { rootDropTarget, folderDropTargets } = useDropTargets(folders, onMoveConversation);
  const [{ isOver: isOverRoot }, dropRoot] = rootDropTarget;
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const handleCreateFolder = () => {
    if (newFolderName.trim() === '') {
      toast.error('O nome da pasta não pode estar vazio');
      return;
    }
    
    onCreateFolder(newFolderName);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };
  
  const getConversationsInFolder = (folderId: string | null) => {
    return conversations.filter(conv => {
      const convFolderId = conversationFolders[conv.id] || null;
      return convFolderId === folderId;
    });
  };

  if (!isUserLoggedIn) {
    return (
      <div className="p-4 text-center text-inventu-gray">
        <p>Faça login para ver suas conversas</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-inventu-gray flex flex-col items-center">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p>Carregando conversas...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-inventu-gray">
        <p>Nenhuma conversa encontrada</p>
        <p className="text-sm">Crie uma nova conversa para começar</p>
      </div>
    );
  }

  const unorganizedConversations = getConversationsInFolder(null);

  return (
    <div className="flex flex-col p-2 space-y-2" id="conversation-list">
      <Button 
        variant="ghost" 
        className="flex items-center justify-between text-inventu-gray hover:text-white hover:bg-inventu-gray/20" 
        onClick={() => setIsCreatingFolder(true)}
      >
        <div className="flex items-center">
          <FolderPlus className="h-4 w-4 mr-2" />
          <span>Nova Pasta</span>
        </div>
      </Button>
      
      {isCreatingFolder && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-inventu-gray/10 rounded-md">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nome da pasta"
            className="h-8 bg-inventu-card border-inventu-gray/50 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }
            }}
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-2 h-7 hover:bg-green-500/20 text-green-500"
            onClick={handleCreateFolder}
          >
            OK
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-2 h-7 hover:bg-red-500/20 text-red-500"
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName('');
            }}
          >
            X
          </Button>
        </div>
      )}
      
      {folders.map((folder) => {
        // Get the drop target for this folder from our pre-created map
        const dropTarget = folderDropTargets[folder.id];
        // Now we properly destructure to access isOver and the ref
        const [{ isOver }, drop] = dropTarget;
        
        return (
          <div 
            key={folder.id} 
            className={`space-y-1 ${isOver ? 'bg-inventu-gray/20 rounded-md' : ''}`}
            ref={drop}
          >
            <div 
              className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-inventu-gray/10 text-inventu-gray hover:text-white"
              onClick={() => toggleFolder(folder.id)}
            >
              <div className="flex items-center">
                {expandedFolders[folder.id] ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <Folder className="h-4 w-4 mr-2" />
                <span>{folder.name}</span>
              </div>
            </div>
            
            {expandedFolders[folder.id] && (
              <div className="pl-6 space-y-1">
                {getConversationsInFolder(folder.id).map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={currentConversationId === conv.id}
                    onSelect={() => onSelectConversation(conv.id)}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
                    onMove={(folderId) => onMoveConversation(conv.id, folderId)}
                    folders={folders}
                    currentFolderId={folder.id}
                  />
                ))}
                {getConversationsInFolder(folder.id).length === 0 && (
                  <div className="text-sm text-inventu-gray/70 italic p-2">
                    Pasta vazia
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      <div 
        className={`space-y-1 ${isOverRoot ? 'bg-inventu-gray/20 rounded-md p-1' : ''}`}
        ref={dropRoot}
      >
        {unorganizedConversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={currentConversationId === conv.id}
            onSelect={() => onSelectConversation(conv.id)}
            onDelete={() => onDeleteConversation(conv.id)}
            onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
            onMove={(folderId) => onMoveConversation(conv.id, folderId)}
            folders={folders}
            currentFolderId={null}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
