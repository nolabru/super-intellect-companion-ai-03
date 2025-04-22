
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Image,
  Brain as Memory,
  Coins,
  LogOut,
  LogIn
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarNavigationProps {
  closeMenu?: () => void;
  onCreateConversation?: () => void;
}

const menuItems = [
  {
    path: '/',
    label: 'Chat',
    icon: <MessageSquare className="h-4 w-4" />,
    test: (loc: string) => loc === '/' || loc.startsWith('/c/')
  },
  {
    path: '/gallery',
    label: 'Galeria',
    icon: <Image className="h-4 w-4" />,
    test: (loc: string) => loc === '/gallery'
  },
  {
    path: '/memory',
    label: 'Memória',
    icon: <Memory className="h-4 w-4" />,
    test: (loc: string) => loc === '/memory'
  },
  {
    path: '/tokens',
    label: 'Tokens',
    icon: <Coins className="h-4 w-4" />,
    test: (loc: string) => loc === '/tokens'
  },
];

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  closeMenu
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleClick = (path: string) => {
    navigate(path);
    if (closeMenu && isMobile) closeMenu();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    if (closeMenu && isMobile) closeMenu();
  };

  return (
    <nav className="flex flex-wrap gap-1 py-1">
      {menuItems.map((item) => (
        <Button
          key={item.label}
          variant={item.test(location.pathname) ? "secondary" : "ghost"}
          className={`
            w-full justify-start px-3 py-2
            gap-2 rounded-lg text-sm
            ${item.test(location.pathname)
              ? "bg-white/10 text-white font-medium"
              : "hover:bg-white/5 hover:text-white text-white/60"
            }
            transition-colors h-9
          `}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}

      <div className="w-full pt-2 mt-2 border-t border-white/5">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg px-3 py-2 h-9 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg px-3 py-2 h-9 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            onClick={() => handleClick('/auth')}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
