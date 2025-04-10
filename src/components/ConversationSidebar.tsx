
import React, { useEffect } from 'react';
import { History, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarHeader from './conversation/SidebarHeader';
import ConversationList from './conversation/ConversationList';

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
    setMessages
  } = useConversation();
  const { user } = useAuth();

  const handleNewConversation = async () => {
    console.log('[ConversationSidebar] Creating new conversation from sidebar button');
    
    clearMessages();
    setMessages([]);
    
    const success = await createNewConversation();
    
    console.log(`[ConversationSidebar] New conversation created: ${success ? 'success' : 'failed'}`);
    if (!success) {
      // This toast is handled in the createNewConversation function
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    console.log(`[ConversationSidebar] Selecting conversation from sidebar: ${conversationId}`);
    if (currentConversationId === conversationId) {
      console.log(`[ConversationSidebar] Conversation ${conversationId} is already selected`);
      return;
    }
    
    clearMessages();
    setMessages([]);
    
    setCurrentConversationId(conversationId);
  };

  useEffect(() => {
    console.log(`[ConversationSidebar] Current conversation ID: ${currentConversationId}`);
    console.log(`[ConversationSidebar] Available conversations: ${conversations.map(c => c.id).join(', ')}`);
  }, [currentConversationId, conversations]);

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
        />
      </div>
    </div>
  );
};

export default ConversationSidebar;
