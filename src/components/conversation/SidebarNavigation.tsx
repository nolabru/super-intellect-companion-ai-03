
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Image, Home, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarNavigationProps {
  onCreateConversation: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ onCreateConversation }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="space-y-2 mb-4">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-gray-300 hover:text-white"
        onClick={onCreateConversation}
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        Nova Conversa
      </Button>
      
      <Link to="/">
        <Button 
          variant="ghost" 
          className={`w-full justify-start ${location.pathname === '/' && !location.pathname.startsWith('/c/') ? 'bg-inventu-gray/20 text-white' : 'text-gray-300 hover:text-white'}`}
        >
          <Home className="h-5 w-5 mr-2" />
          Chat
        </Button>
      </Link>
      
      <Link to="/gallery">
        <Button 
          variant="ghost" 
          className={`w-full justify-start ${location.pathname === '/gallery' ? 'bg-inventu-gray/20 text-white' : 'text-gray-300 hover:text-white'}`}
        >
          <Image className="h-5 w-5 mr-2" />
          Galeria de Mídia
        </Button>
      </Link>
      
      {user && (
        <Link to="/memory">
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${location.pathname === '/memory' ? 'bg-inventu-gray/20 text-white' : 'text-gray-300 hover:text-white'}`}
          >
            <Brain className="h-5 w-5 mr-2" />
            Memória do Usuário
          </Button>
        </Link>
      )}
    </div>
  );
};

export default SidebarNavigation;
