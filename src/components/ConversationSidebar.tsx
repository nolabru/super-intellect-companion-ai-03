import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SidebarHeader from './conversation/SidebarHeader';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useConversation } from '@/hooks/useConversation';

interface ConversationSidebarProps {
  onToggleSidebar?: () => void;
  isOpen?: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ 
  onToggleSidebar,
  isOpen = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Criando nova conversa');
    
    // Feedback visual imediato - limpar mensagens
    clearMessages();
    
    // Desselecionar conversa atual para feedback visual
    setCurrentConversationId(null);
    
    // Redirecionar para a página inicial ao iniciar nova conversa
    navigate('/', { replace: true });
    
    // Criar nova conversa com tratamento de erro
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

  return (
    <div className={cn(
      "flex flex-col h-full bg-inventu-dark border-r border-white/10",
      "transition-all duration-300 ease-in-out",
      !isOpen && "opacity-0 pointer-events-none"
    )}>
      <SidebarHeader 
        onNewConversation={handleNewConversation}
        onToggleSidebar={onToggleSidebar}
        isUserLoggedIn={!!user}
      />
    </div>
  );
};

export default ConversationSidebar;
