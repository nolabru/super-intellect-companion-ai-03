
import React, { useEffect } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarHeader from './conversation/SidebarHeader';
import ConversationList from './conversation/ConversationList';
import { toast } from 'sonner';

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

  // Função para criar uma nova conversa
  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Criando nova conversa');
    
    // Limpar mensagens imediatamente para feedback visual
    clearMessages();
    
    // Desativar o ID da conversa atual temporariamente
    setCurrentConversationId(null);
    
    // Criar nova conversa
    const success = await createNewConversation();
    
    if (!success) {
      toast.error('Não foi possível criar uma nova conversa');
    }
  };

  // Função para selecionar uma conversa existente
  const handleSelectConversation = (conversationId: string) => {
    console.log(`[ConversationSidebar] Selecionando conversa: ${conversationId}`);
    
    if (currentConversationId === conversationId) {
      console.log(`[ConversationSidebar] Forçando recarregamento da conversa: ${conversationId}`);
      forceReloadMessages();
      return;
    }
    
    // Limpar mensagens antes de mudar a conversa para feedback visual imediato
    clearMessages();
    
    // Atualizar o ID da conversa atual
    setCurrentConversationId(conversationId);
  };

  // Vista de barra lateral recolhida
  if (!isOpen && onToggleSidebar) {
    return (
      <div className="absolute left-0 top-24 z-10">
        <Button
          onClick={onToggleSidebar}
          size="icon"
          variant="secondary"
          className="rounded-r-md rounded-l-none border-l-0"
          title="Abrir menu"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-inventu-dark border-r border-inventu-gray/30">
      <SidebarHeader 
        onNewConversation={handleNewConversation}
        onToggleSidebar={onToggleSidebar}
        isUserLoggedIn={!!user}
      />
      
      <div className="flex items-center p-4 text-inventu-gray border-b border-inventu-gray/30">
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
        />
      </div>
    </div>
  );
};

export default ConversationSidebar;
