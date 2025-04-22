
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

interface SidebarNavigationProps {
  closeMenu?: () => void;
  onCreateConversation?: () => void;
}

const menuItems = [
  {
    path: '/',
    label: 'Chat',
    icon: <MessageSquare className="h-5 w-5" />,
    test: (loc: string) => loc === '/' || loc.startsWith('/c/')
  },
  {
    path: '/gallery',
    label: 'Galeria',
    icon: <Image className="h-5 w-5" />,
    test: (loc: string) => loc === '/gallery'
  },
  {
    path: '/memory',
    label: 'Memória',
    icon: <Memory className="h-5 w-5" />,
    test: (loc: string) => loc === '/memory'
  },
  {
    path: '/tokens',
    label: 'Tokens',
    icon: <Coins className="h-5 w-5" />,
    test: (loc: string) => loc === '/tokens'
  },
];

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  closeMenu
}) => {
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
    <nav className="flex flex-col gap-1 pt-3">
      {menuItems.map((item) => (
        <Button
          key={item.label}
          variant={item.test(location.pathname) ? "secondary" : "ghost"}
          className={`
            w-full justify-start px-4 py-3
            gap-4 rounded-2xl font-medium text-inventu-gray transition
            text-base
            ${item.test(location.pathname)
              ? "bg-inventu-blue/15 text-inventu-blue font-semibold"
              : "hover:bg-inventu-blue/10 hover:text-inventu-blue"
            }
            hover:scale-[1.03] active:scale-95
            shadow-none
          `}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}

      <div className="pt-4 mt-5 border-t border-inventu-gray/20 flex flex-col gap-2">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-2xl px-4 py-3 text-inventu-gray/70 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-2xl px-4 py-3 text-inventu-gray/70 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
            onClick={() => handleClick('/auth')}
          >
            <LogIn className="mr-3 h-5 w-5" />
            Entrar
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;

