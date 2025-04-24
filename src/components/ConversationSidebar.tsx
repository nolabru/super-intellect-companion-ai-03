
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useConversation } from '@/hooks/useConversation';
import ConversationList from './conversation/ConversationList';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import SidebarNavigation from './conversation/SidebarNavigation';

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
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    createNewConversation,
    deleteConversation,
    renameConversation,
    clearMessages,
    loading
  } = useConversation();

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

  const toggleMenu = () => {
    setMenuExpanded(!menuExpanded);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-black/90 backdrop-blur-xl border-r border-white/10",
      "transition-all duration-300 ease-out",
      !isOpen && "opacity-0 pointer-events-none"
    )}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar content with fixed width for conversation history */}
        <div className="flex flex-col min-w-64 flex-1 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <Button 
              onClick={handleNewConversation}
              className="flex items-center justify-center bg-white/5 hover:bg-white/10
                text-white font-medium transition-all duration-200
                active:scale-95 rounded-xl h-11 w-full
                border border-white/10 backdrop-blur-sm"
              disabled={!user}
              title="Nova Conversa"
            >
              <span className="flex items-center">
                <span className="mr-2">+</span>
                Nova Conversa
              </span>
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ConversationList 
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={setCurrentConversationId}
              onDeleteConversation={deleteConversation}
              onRenameConversation={renameConversation}
              isUserLoggedIn={!!user}
              isLoading={loading}
              isMinimized={false}
            />
          </div>
        </div>
        
        {/* Navigation sidebar with buttons for gallery, memory, etc */}
        <div className="relative border-l border-white/10">
          <Button
            onClick={toggleMenu}
            size="icon"
            variant="ghost"
            className={cn(
              "absolute -right-4 top-4 z-50 size-8 bg-black/90 border border-white/10",
              "text-white/70 hover:text-white rounded-full transition-all duration-300",
              "hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/20"
            )}
          >
            {menuExpanded ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          
          <div className={cn(
            "flex flex-col h-full transition-all duration-300 ease-out overflow-hidden",
            menuExpanded ? "w-56" : "w-16"
          )}>
            <SidebarNavigation 
              closeMenu={onToggleSidebar}
              isMinimized={!menuExpanded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;
