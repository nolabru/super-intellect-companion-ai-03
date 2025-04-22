import React, { useEffect, useState } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarHeader from './conversation/SidebarHeader';
import ConversationList from './conversation/ConversationList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useIsMobile } from '@/hooks/use-mobile';

interface FolderType {
  id: string;
  name: string;
  isOpen?: boolean;
}

interface ConversationSidebarProps {
  onToggleSidebar?: () => void;
  isOpen?: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  onToggleSidebar,
  isOpen = true
}) => {
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    createNewConversation,
    deleteConversation,
    renameConversation,
    clearMessages,
    forceReloadMessages,
    loading
  } = useConversation();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [conversationFolders, setConversationFolders] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) {
      const savedFolders = localStorage.getItem(`folders_${user.id}`);
      const savedConversationFolders = localStorage.getItem(`conversation_folders_${user.id}`);
      
      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch (e) {
          console.error('Erro ao carregar pastas:', e);
        }
      }
      
      if (savedConversationFolders) {
        try {
          setConversationFolders(JSON.parse(savedConversationFolders));
        } catch (e) {
          console.error('Erro ao carregar associações de conversa-pasta:', e);
        }
      }
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      localStorage.setItem(`folders_${user.id}`, JSON.stringify(folders));
    }
  }, [folders, user]);
  
  useEffect(() => {
    if (user) {
      localStorage.setItem(`conversation_folders_${user.id}`, JSON.stringify(conversationFolders));
    }
  }, [conversationFolders, user]);

  const handleCreateFolder = (name: string) => {
    const newFolder: FolderType = {
      id: uuidv4(),
      name,
      isOpen: true
    };
    
    setFolders(prev => [newFolder, ...prev]);
    toast.success(`Pasta "${name}" criada com sucesso`);
  };
  
  const handleRenameFolder = (id: string, newName: string) => {
    setFolders(prev => 
      prev.map(folder => 
        folder.id === id ? { ...folder, name: newName } : folder
      )
    );
    toast.success(`Pasta renomeada para "${newName}"`);
  };
  
  const handleDeleteFolder = (id: string) => {
    const updatedConversationFolders = { ...conversationFolders };
    Object.keys(updatedConversationFolders).forEach(convId => {
      if (updatedConversationFolders[convId] === id) {
        updatedConversationFolders[convId] = null;
      }
    });
    
    setConversationFolders(updatedConversationFolders);
    setFolders(prev => prev.filter(folder => folder.id !== id));
    toast.success('Pasta excluída com sucesso');
  };
  
  const handleMoveConversation = (conversationId: string, folderId: string | null) => {
    setConversationFolders(prev => ({
      ...prev,
      [conversationId]: folderId
    }));
    
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Sem pasta';
    toast.success(`Conversa movida para ${folderName}`);
  };

  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Criando nova conversa');
    
    clearMessages();
    setCurrentConversationId(null);
    navigate('/', { replace: true });
    
    try {
      const success = await createNewConversation();
      if (!success) {
        toast.error('Não foi possível criar uma nova conversa');
      }
    } catch (error) {
      console.error('[ConversationSidebar] Erro ao criar nova conversa:', error);
      toast.error('Ocorreu um erro ao criar nova conversa');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    if (!conversationId) {
      console.error('[ConversationSidebar] ID de conversa inválido');
      return;
    }
    
    console.log(`[ConversationSidebar] Selecionando conversa: ${conversationId}`);
    
    clearMessages();
    
    if (currentConversationId === conversationId) {
      console.log(`[ConversationSidebar] Forçando recarregamento da conversa: ${conversationId}`);
      forceReloadMessages();
    } else {
      setCurrentConversationId(conversationId);
      navigate(`/c/${conversationId}`, { replace: true });
    }
  };

  if (!isOpen && onToggleSidebar) {
    return (
      <div className="fixed left-0 top-16 z-30">
        <Button
          onClick={onToggleSidebar}
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-r-xl bg-inventu-dark/90 border-white/10 shadow-sm hover:bg-inventu-dark"
          title="Abrir menu"
        >
          <ChevronLeft className="h-5 w-5 rotate-180 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={`
      h-full flex flex-col
      bg-inventu-darker
      border-r border-white/5 
      w-[260px] md:w-[280px]
      ${isMobile ? 'max-w-[85vw]' : 'max-w-[280px]'}
      transition-all duration-200
      shadow-xl
      fixed md:static
      top-0 left-0 bottom-0
      z-50
    `}>
      <SidebarHeader
        onNewConversation={handleNewConversation}
        onToggleSidebar={onToggleSidebar}
        isUserLoggedIn={!!user}
      />

      <div className="flex items-center px-3 py-2 gap-2 text-white/60 border-b border-white/5 bg-inventu-dark/40">
        <History className="h-3.5 w-3.5" />
        <h2 className="font-medium select-none tracking-tight text-sm">Histórico</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <DndProvider backend={HTML5Backend}>
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={deleteConversation}
            onRenameConversation={renameConversation}
            isUserLoggedIn={!!user}
            isLoading={loading}
            folders={folders}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveConversation={handleMoveConversation}
            conversationFolders={conversationFolders}
          />
        </DndProvider>
      </div>
    </aside>
  );
};

export default ConversationSidebar;
