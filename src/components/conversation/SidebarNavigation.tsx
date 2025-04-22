
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
            w-full justify-start px-4 py-2
            gap-3 rounded-xl font-semibold text-gray-700 dark:text-gray-200
            ${item.test(location.pathname)
              ? "bg-inventu-blue/10 text-inventu-blue"
              : "hover:bg-inventu-blue/10 hover:text-inventu-blue"
            }
            transition-all
          `}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}

      <div className="pt-3 mt-2 border-t border-gray-200/50 flex flex-col gap-2">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-2 text-gray-400 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-2 text-gray-400 hover:bg-inventu-blue/10 hover:text-inventu-blue transition-all"
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
