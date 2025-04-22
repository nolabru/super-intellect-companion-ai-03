
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
    icon: <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />,
    test: (loc: string) => loc === '/' || loc.startsWith('/c/')
  },
  {
    path: '/gallery',
    label: 'Galeria',
    icon: <Image className="h-4 w-4 md:h-5 md:w-5" />,
    test: (loc: string) => loc === '/gallery'
  },
  {
    path: '/memory',
    label: 'Memória',
    icon: <Memory className="h-4 w-4 md:h-5 md:w-5" />,
    test: (loc: string) => loc === '/memory'
  },
  {
    path: '/tokens',
    label: 'Tokens',
    icon: <Coins className="h-4 w-4 md:h-5 md:w-5" />,
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
    <nav className="flex flex-col gap-1 pt-2">
      {menuItems.map((item) => (
        <Button
          key={item.label}
          variant={item.test(location.pathname) ? "secondary" : "ghost"}
          className={`
            w-full justify-start px-3 py-2.5
            gap-3 rounded-xl font-medium text-inventu-gray transition
            text-sm md:text-base
            ${item.test(location.pathname)
              ? "bg-inventu-blue/15 text-inventu-blue font-medium"
              : "hover:bg-inventu-blue/10 hover:text-inventu-blue"
            }
            hover:scale-[1.01] active:scale-95
            shadow-none
          `}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}

      <div className="pt-3 mt-3 border-t border-inventu-gray/10 flex flex-col gap-1">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-3 py-2.5 text-sm md:text-base text-inventu-gray/70 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4 md:h-5 md:w-5" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-3 py-2.5 text-sm md:text-base text-inventu-gray/70 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
            onClick={() => handleClick('/auth')}
          >
            <LogIn className="mr-3 h-4 w-4 md:h-5 md:w-5" />
            Entrar
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
