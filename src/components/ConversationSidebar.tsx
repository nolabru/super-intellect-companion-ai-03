
import React, { useEffect, useState, useRef } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarHeader from './conversation/SidebarHeader';
import ConversationList from './conversation/ConversationList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Mapa para controle de operações recentes
const recentOperations = new Map<string, number>();
const OPERATION_COOLDOWN = 1000; // 1 segundo de cooldown

// Interface para as pastas
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
  // Estado para gerenciar pastas
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [conversationFolders, setConversationFolders] = useState<Record<string, string | null>>({});
  const processingRef = useRef<Record<string, boolean>>({});
  
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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // Função para verificar se pode executar operação
  const canPerformOperation = (key: string): boolean => {
    const now = Date.now();
    const lastOp = recentOperations.get(key);
    
    if (lastOp && now - lastOp < OPERATION_COOLDOWN) {
      return false;
    }
    
    recentOperations.set(key, now);
    return true;
  };

  // Carregar pastas do localStorage ao iniciar
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

  // Salvar pastas no localStorage quando mudar
  useEffect(() => {
    if (user) {
      localStorage.setItem(`folders_${user.id}`, JSON.stringify(folders));
    }
  }, [folders, user]);

  // Salvar associações de conversa-pasta no localStorage quando mudar
  useEffect(() => {
    if (user) {
      localStorage.setItem(`conversation_folders_${user.id}`, JSON.stringify(conversationFolders));
    }
  }, [conversationFolders, user]);

  // Função para criar uma nova pasta
  const handleCreateFolder = (name: string) => {
    const operationKey = `create_folder_${name}`;
    if (!canPerformOperation(operationKey)) return;
    
    const newFolder: FolderType = {
      id: uuidv4(),
      name,
      isOpen: true
    };
    setFolders(prev => [newFolder, ...prev]);
    toast.success(`Pasta "${name}" criada com sucesso`);
  };

  // Função para renomear uma pasta
  const handleRenameFolder = (id: string, newName: string) => {
    const operationKey = `rename_folder_${id}_${newName}`;
    if (!canPerformOperation(operationKey)) return;
    
    setFolders(prev => prev.map(folder => folder.id === id ? {
      ...folder,
      name: newName
    } : folder));
    toast.success(`Pasta renomeada para "${newName}"`);
  };

  // Função para excluir uma pasta
  const handleDeleteFolder = (id: string) => {
    const operationKey = `delete_folder_${id}`;
    if (!canPerformOperation(operationKey)) return;
    
    // Remover associações de conversas com esta pasta
    const updatedConversationFolders = {
      ...conversationFolders
    };
    Object.keys(updatedConversationFolders).forEach(convId => {
      if (updatedConversationFolders[convId] === id) {
        updatedConversationFolders[convId] = null;
      }
    });
    setConversationFolders(updatedConversationFolders);
    setFolders(prev => prev.filter(folder => folder.id !== id));
    toast.success('Pasta excluída com sucesso');
  };

  // Função para mover uma conversa para uma pasta
  const handleMoveConversation = (conversationId: string, folderId: string | null) => {
    const operationKey = `move_conversation_${conversationId}_${folderId}`;
    if (!canPerformOperation(operationKey)) return;
    
    setConversationFolders(prev => ({
      ...prev,
      [conversationId]: folderId
    }));
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Sem pasta';
    toast.success(`Conversa movida para ${folderName}`);
  };

  // Função para criar uma nova conversa com navegação atualizada
  const handleNewConversation = async () => {
    if (processingRef.current.newConversation) return;
    processingRef.current.newConversation = true;
    
    console.log('[ConversationSidebar] Criando nova conversa');

    // Check if user is logged in
    if (!user) {
      console.log('[ConversationSidebar] Usuário não está logado, redirecionando para a página de login');
      toast.info('Faça login para criar uma nova conversa');
      navigate('/auth', { state: { from: location.pathname } });
      processingRef.current.newConversation = false;
      return;
    }

    // Feedback visual imediato - limpar mensagens
    clearMessages();

    // Desselecionar conversa atual para feedback visual
    setCurrentConversationId(null);

    // Redirecionar para a página inicial ao iniciar nova conversa
    navigate('/', {
      replace: true
    });

    // Criar nova conversa com tratamento de erro
    try {
      // Usar um ID de toast único
      const toastId = toast.loading('Criando nova conversa...');
      
      const success = await createNewConversation();
      if (success) {
        toast.success('Nova conversa criada com sucesso', { id: toastId });
      } else {
        toast.error('Não foi possível criar uma nova conversa', { id: toastId });
      }
    } catch (error) {
      console.error('[ConversationSidebar] Erro ao criar nova conversa:', error);
      toast.error('Ocorreu um erro ao criar nova conversa');
    } finally {
      processingRef.current.newConversation = false;
    }
  };

  // Função para selecionar uma conversa existente com navegação
  const handleSelectConversation = (conversationId: string) => {
    const operationKey = `select_conversation_${conversationId}`;
    if (!canPerformOperation(operationKey) || processingRef.current[`select_${conversationId}`]) return;
    
    processingRef.current[`select_${conversationId}`] = true;
    
    if (!conversationId) {
      console.error('[ConversationSidebar] ID de conversa inválido');
      processingRef.current[`select_${conversationId}`] = false;
      return;
    }
    
    console.log(`[ConversationSidebar] Selecionando conversa: ${conversationId}`);

    // Limpar mensagens imediatamente para feedback visual
    clearMessages();

    try {
      // Se clicar na mesma conversa, forçar recarregamento
      if (currentConversationId === conversationId) {
        console.log(`[ConversationSidebar] Forçando recarregamento da conversa: ${conversationId}`);
        // Força recarregar as mensagens da conversa atual
        forceReloadMessages();
      } else {
        // Atualizar conversa selecionada e navegar para a URL
        setCurrentConversationId(conversationId);
        navigate(`/c/${conversationId}`, {
          replace: true
        });
      }
    } finally {
      // Liberar após operação
      setTimeout(() => {
        processingRef.current[`select_${conversationId}`] = false;
      }, 500);
    }
  };

  // Vista de barra lateral recolhida
  if (!isOpen && onToggleSidebar) {
    return <div className="absolute left-0 top-24 z-10">
        <Button onClick={onToggleSidebar} size="icon" variant="secondary" className="rounded-r-md rounded-l-none border-l-0" title="Abrir menu">
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>;
  }
  
  return <div className="h-full flex flex-col bg-inventu-dark border-r border-inventu-gray/30">
      <SidebarHeader onNewConversation={handleNewConversation} onToggleSidebar={onToggleSidebar} isUserLoggedIn={!!user} />
      
      <div className="flex items-center p-4 text-inventu-gray border-b border-inventu-gray/30 bg-transparent">
        <History className="mr-2 h-4 w-4" />
        <h2 className="font-medium">Histórico de Conversas</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>;
};

export default ConversationSidebar;
