
import React from 'react';
import { MessageCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useConversation } from '@/hooks/useConversation';

const SidebarNavigation: React.FC = () => {
  const location = useLocation();
  const { clearMessages, setMessages } = useConversation();
  
  // Limpar mensagens ao navegar entre abas
  const handleNavigate = () => {
    // Limpar mensagens apenas se estiver navegando para outra página
    if (location.pathname !== '/') {
      console.log('[SidebarNavigation] Navigating away from chat, clearing messages');
      clearMessages();
      setMessages([]);
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link to="/" className="flex-1" onClick={handleNavigate}>
        <Button 
          variant={location.pathname === '/' ? "default" : "outline"}
          className={`w-full ${location.pathname === '/' 
            ? 'bg-inventu-blue text-white' 
            : 'border-inventu-gray/30 text-white hover:bg-inventu-gray/20'}`}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat
        </Button>
      </Link>
      
      <Link to="/gallery" className="flex-1" onClick={handleNavigate}>
        <Button 
          variant={location.pathname === '/gallery' ? "default" : "outline"}
          className={`w-full ${location.pathname === '/gallery' 
            ? 'bg-inventu-blue text-white' 
            : 'border-inventu-gray/30 text-white hover:bg-inventu-gray/20'}`}
        >
          <Image className="mr-2 h-4 w-4" />
          Galeria
        </Button>
      </Link>
    </div>
  );
};

export default SidebarNavigation;
