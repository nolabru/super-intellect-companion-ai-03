
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Image, 
  Brain as Memory, 
  Coins,
  LogIn,
  LogOut,
  Menu
} from 'lucide-react';
import SidebarNavLink from '../sidebar/SidebarNavLink';
import { Button } from '@/components/ui/button';

interface SidebarNavigationProps {
  closeMenu?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ 
  closeMenu 
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    if (closeMenu) closeMenu();
  };

  const navigationItems = [
    { href: '/', icon: MessageSquare, label: 'Chat' },
    { href: '/gallery', icon: Image, label: 'Galeria' },
    { href: '/memory', icon: Memory, label: 'Memória' },
    { href: '/tokens', icon: Coins, label: 'Tokens' },
  ];

  return (
    <nav className="flex flex-col h-full">
      <div className="px-3 py-2 flex items-center justify-between md:hidden">
        <span className="text-white/90 font-medium">Menu</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeMenu}
          className="text-white/70 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 px-3 space-y-2 overflow-y-auto py-4">
        {navigationItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-white/10">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Sair</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
            onClick={() => {
              navigate('/auth');
              if (closeMenu) closeMenu();
            }}
          >
            <LogIn className="mr-3 h-5 w-5" />
            <span>Entrar</span>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
