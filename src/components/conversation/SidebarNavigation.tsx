
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Image, 
  Memory, 
  Coins,
  LogOut,
  LogIn,
  BrainCircuit
} from 'lucide-react';

interface SidebarNavigationProps {
  closeMenu?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ closeMenu }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    navigate(path);
    if (closeMenu) closeMenu();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    if (closeMenu) closeMenu();
  };

  return (
    <div className="py-4 px-2">
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            (location.pathname === '/' || location.pathname.startsWith('/c/')) ? 'bg-inventu-blue/10 text-inventu-blue' : 'text-white hover:bg-inventu-dark/50'
          }`}
          onClick={() => handleClick('/')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            location.pathname === '/gallery' ? 'bg-inventu-blue/10 text-inventu-blue' : 'text-white hover:bg-inventu-dark/50'
          }`}
          onClick={() => handleClick('/gallery')}
        >
          <Image className="mr-2 h-4 w-4" />
          Galeria
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            location.pathname === '/memory' ? 'bg-inventu-blue/10 text-inventu-blue' : 'text-white hover:bg-inventu-dark/50'
          }`}
          onClick={() => handleClick('/memory')}
        >
          <Memory className="mr-2 h-4 w-4" />
          Memória
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            location.pathname === '/tokens' ? 'bg-inventu-blue/10 text-inventu-blue' : 'text-white hover:bg-inventu-dark/50'
          }`}
          onClick={() => handleClick('/tokens')}
        >
          <Coins className="mr-2 h-4 w-4" />
          Tokens
        </Button>
        
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            location.pathname === '/google-integrations' ? 'bg-inventu-blue/10 text-inventu-blue' : 'text-white hover:bg-inventu-dark/50'
          }`}
          onClick={() => handleClick('/google-integrations')}
        >
          <BrainCircuit className="mr-2 h-4 w-4" />
          Integrações Google
        </Button>
      </div>
      
      <div className="pt-4 mt-4 border-t border-inventu-gray/30">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-inventu-dark/50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-inventu-dark/50"
            onClick={() => handleClick('/auth')}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarNavigation;
