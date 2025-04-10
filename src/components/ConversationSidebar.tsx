
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

  // Função para criar uma nova conversa - Improved for reliability
  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Criando nova conversa');
    
    // Feedback visual imediato - limpar mensagens
    clearMessages();
    
    // Desselecionar conversa atual para feedback visual
    setCurrentConversationId(null);
    
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

  // Função para selecionar uma conversa existente - Improved for reliability
  const handleSelectConversation = (conversationId: string) => {
    if (!conversationId) {
      console.error('[ConversationSidebar] ID de conversa inválido');
      return;
    }
    
    console.log(`[ConversationSidebar] Selecionando conversa: ${conversationId}`);
    
    if (currentConversationId === conversationId) {
      console.log(`[ConversationSidebar] Forçando recarregamento da conversa: ${conversationId}`);
      // Limpar mensagens para feedback visual antes do recarregamento
      clearMessages();
      // Força recarregar as mensagens da conversa atual
      forceReloadMessages();
      return;
    }
    
    // Limpar mensagens imediatamente para feedback visual
    clearMessages();
    
    // Atualizar conversa selecionada
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
