
import React, { useState } from 'react';
import { MoreHorizontal, FolderPlus, Edit, Trash, FolderClosed, ChevronRight, MessageSquare, Folder, FolderX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface FolderType {
  id: string;
  name: string;
  isOpen?: boolean;
}

interface ConversationItemProps {
  id: string;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  isUserLoggedIn: boolean;
  onMove?: (conversationId: string, folderId: string | null) => void;
  folders?: FolderType[];
  folderId?: string | null;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ id, title, isSelected, onClick, onDelete, onRename, isUserLoggedIn, onMove, folders = [], folderId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const handleRename = () => {
    onRename(newTitle);
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={`flex items-center p-2 rounded-lg cursor-pointer relative hover:bg-inventu-gray/10 ${
          isSelected ? 'bg-inventu-gray/15' : ''
        }`}
        onClick={() => !isEditing && onClick()}
      >
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 py-1">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-7 bg-inventu-darker/90 text-sm border-inventu-gray/30"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <Button 
                size="sm" 
                className="h-7 text-xs py-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
              >
                Salvar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs py-0" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setNewTitle(title);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MessageSquare className="shrink-0 h-4 w-4 text-inventu-gray/70" />
              <span className="truncate text-sm">{title}</span>
            </div>
          )}
        </div>

        {!isEditing && isUserLoggedIn && (
          <div onClick={(e) => e.stopPropagation()} className="ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-inventu-dark text-white border-inventu-gray/30 min-w-[180px]">
                <DropdownMenuItem
                  className="cursor-pointer flex gap-2 text-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" /> Renomear
                </DropdownMenuItem>
                
                {onMove && (
                  <DropdownMenuItem
                    className="cursor-pointer flex gap-2 text-sm"
                    onClick={() => setMoveDialogOpen(true)}
                  >
                    <Folder className="h-4 w-4" /> Mover para pasta
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-inventu-gray/20" />
                
                <DropdownMenuItem
                  className="cursor-pointer flex gap-2 text-sm text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash className="h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <AlertDialogContent className="bg-inventu-dark border-inventu-gray/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Excluir conversa</AlertDialogTitle>
                  <AlertDialogDescription className="text-inventu-gray/80">
                    Esta ação não pode ser desfeita. Esta conversa será permanentemente excluída.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-inventu-darker text-white border-inventu-gray/30 hover:bg-inventu-gray/20">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {onMove && (
              <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <DialogContent className="bg-inventu-dark border-inventu-gray/30 text-white sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="text-white">Mover conversa para pasta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-3 max-h-[300px] overflow-y-auto">
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-inventu-gray/10 cursor-pointer ${folderId === null ? 'bg-inventu-gray/15' : ''}`}
                      onClick={() => {
                        onMove(id, null);
                        setMoveDialogOpen(false);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Sem pasta (raiz)</span>
                    </div>
                    {folders.map(folder => (
                      <div 
                        key={folder.id}
                        className={`flex items-center gap-2 p-2 rounded-md hover:bg-inventu-gray/10 cursor-pointer ${folderId === folder.id ? 'bg-inventu-gray/15' : ''}`}
                        onClick={() => {
                          onMove(id, folder.id);
                          setMoveDialogOpen(false);
                        }}
                      >
                        <FolderClosed className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setMoveDialogOpen(false)}
                      className="border-inventu-gray/30"
                    >
                      Cancelar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </>
  );
};

interface ConversationListProps {
  conversations: { id: string; title: string }[];
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

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  isUserLoggedIn,
  isLoading = false,
  folders = [],
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveConversation,
  conversationFolders = {}
}) => {
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderState, setRenameFolderState] = useState<{ id: string; name: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  // Group conversations by folder
  const conversationsInFolders: Record<string | 'root', { id: string; title: string }[]> = {
    root: []
  };

  conversations.forEach(conv => {
    const folderId = conversationFolders[conv.id] || 'root';
    if (!conversationsInFolders[folderId]) {
      conversationsInFolders[folderId] = [];
    }
    conversationsInFolders[folderId].push(conv);
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName);
      setNewFolderName('');
      setNewFolderDialogOpen(false);
    }
  };

  const handleRenameFolder = () => {
    if (renameFolderState && onRenameFolder) {
      onRenameFolder(renameFolderState.id, renameFolderState.name);
      setRenameFolderState(null);
    }
  };

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleDeleteFolder = (folderId: string) => {
    if (onDeleteFolder) {
      onDeleteFolder(folderId);
      setDeleteFolderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-10 w-full bg-inventu-gray/10" />
        <Skeleton className="h-10 w-full bg-inventu-gray/10" />
        <Skeleton className="h-10 w-full bg-inventu-gray/10" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 h-32">
        <p className="text-sm text-inventu-gray/70">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isUserLoggedIn && onCreateFolder && (
        <div className="flex justify-between items-center px-3 py-2 border-b border-inventu-gray/20">
          <span className="text-sm font-medium text-inventu-gray/80">Pastas</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-2 space-y-1">
        {/* Render folders */}
        {isUserLoggedIn && folders && folders.length > 0 && (
          <>
            {folders.map((folder) => {
              const folderConversations = conversationsInFolders[folder.id] || [];
              const isExpanded = expandedFolders[folder.id] !== false; // Default to expanded

              return (
                <div key={folder.id} className="mb-1">
                  <div 
                    className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-inventu-gray/10"
                    onClick={() => toggleFolderExpanded(folder.id)}
                  >
                    <ChevronRight 
                      className={`h-4 w-4 mr-1 text-inventu-gray/70 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                    <FolderClosed className="h-4 w-4 mr-2 text-inventu-gray/70" />
                    
                    {renameFolderState?.id === folder.id ? (
                      <div className="flex flex-1 items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input
                          value={renameFolderState.name}
                          onChange={(e) => setRenameFolderState({...renameFolderState, name: e.target.value})}
                          className="h-7 bg-inventu-darker/90 text-sm border-inventu-gray/30 flex-1"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          className="h-7 text-xs py-0" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameFolder();
                          }}
                        >
                          Salvar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs py-0" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameFolderState(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm">{folder.name}</span>
                        
                        <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-inventu-dark text-white border-inventu-gray/30 min-w-[180px]">
                              <DropdownMenuItem
                                className="cursor-pointer flex gap-2 text-sm"
                                onClick={() => setRenameFolderState({id: folder.id, name: folder.name})}
                              >
                                <Edit className="h-4 w-4" /> Renomear pasta
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="bg-inventu-gray/20" />
                              
                              <DropdownMenuItem
                                className="cursor-pointer flex gap-2 text-sm text-destructive focus:text-destructive"
                                onClick={() => setDeleteFolderId(folder.id)}
                              >
                                <FolderX className="h-4 w-4" /> Excluir pasta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {isExpanded && folderConversations.length > 0 && (
                    <div className="ml-5 border-l border-inventu-gray/20 pl-2 mt-1">
                      {folderConversations.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          id={conv.id}
                          title={conv.title}
                          isSelected={conv.id === currentConversationId}
                          onClick={() => onSelectConversation(conv.id)}
                          onDelete={() => onDeleteConversation(conv.id)}
                          onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
                          isUserLoggedIn={isUserLoggedIn}
                          onMove={onMoveConversation}
                          folders={folders}
                          folderId={conversationFolders[conv.id]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="border-t border-inventu-gray/20 my-2"></div>
          </>
        )}
        
        {/* Root conversations */}
        {conversationsInFolders.root && conversationsInFolders.root.length > 0 && (
          <div className="mb-1">
            {conversationsInFolders.root.map((conv) => (
              <ConversationItem
                key={conv.id}
                id={conv.id}
                title={conv.title}
                isSelected={conv.id === currentConversationId}
                onClick={() => onSelectConversation(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
                onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
                isUserLoggedIn={isUserLoggedIn}
                onMove={onMoveConversation}
                folders={folders}
                folderId={conversationFolders[conv.id]}
              />
            ))}
          </div>
        )}
      </div>
      
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
                placeholder="Ex: Trabalho"
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

      {/* Dialog for deleting folder */}
      <AlertDialog 
        open={!!deleteFolderId} 
        onOpenChange={(open) => !open && setDeleteFolderId(null)}
      >
        <AlertDialogContent className="bg-inventu-dark border-inventu-gray/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir pasta</AlertDialogTitle>
            <AlertDialogDescription className="text-inventu-gray/80">
              Esta ação irá mover todas as conversas da pasta para a raiz e excluir a pasta. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-inventu-darker text-white border-inventu-gray/30 hover:bg-inventu-gray/20"
              onClick={() => setDeleteFolderId(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90" 
              onClick={() => {
                if (deleteFolderId) {
                  handleDeleteFolder(deleteFolderId);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationList;
