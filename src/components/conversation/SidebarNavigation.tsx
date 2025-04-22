
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

// Brand menu items with improved contrast and bigger icons
const menuItems = [
  {
    path: '/',
    label: 'Chat',
    icon: <MessageSquare className="h-6 w-6" />,
    test: (loc: string) => loc === '/' || loc.startsWith('/c/')
  },
  {
    path: '/gallery',
    label: 'Galeria',
    icon: <Image className="h-6 w-6" />,
    test: (loc: string) => loc === '/gallery'
  },
  {
    path: '/memory',
    label: 'Memória',
    icon: <Memory className="h-6 w-6" />,
    test: (loc: string) => loc === '/memory'
  },
  {
    path: '/tokens',
    label: 'Tokens',
    icon: <Coins className="h-6 w-6" />,
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
    <nav className="flex flex-wrap gap-2 py-2 md:py-2 px-1">
      {menuItems.map((item) => (
        <Button
          key={item.label}
          variant={item.test(location.pathname) ? "secondary" : "ghost"}
          className={`
            w-full justify-start px-4 py-3
            gap-3 rounded-xl text-base md:text-lg font-semibold
            ${item.test(location.pathname)
              ? "bg-inventu-blue/20 text-inventu-blue shadow-md"
              : "hover:bg-inventu-blue/10 hover:text-inventu-blue text-inventu-blue/70"
            }
            transition-transform h-12
            hover:scale-105 active:scale-95 duration-150
          `}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </Button>
      ))}

      <div className="w-full pt-3 mt-3 border-t border-inventu-blue/10">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-3 h-12 text-base text-inventu-blue/70 hover:bg-inventu-blue/10 hover:text-inventu-blue
              font-medium transition-transform hover:scale-105 active:scale-95 duration-150"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-6 w-6" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-3 h-12 text-base text-inventu-blue/70 hover:bg-inventu-blue/10 hover:text-inventu-blue font-medium hover:scale-105 transition-transform active:scale-95 duration-150"
            onClick={() => handleClick('/auth')}
          >
            <LogIn className="mr-2 h-6 w-6" />
            Entrar
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
