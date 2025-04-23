
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Image, 
  Memory as MemoryIcon, 
  Coins,
  LogIn,
  LogOut
} from 'lucide-react';
import SidebarNavLink from '../sidebar/SidebarNavLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TokenDisplay from '../TokenDisplay';

interface SidebarNavigationProps {
  closeMenu?: () => void;
  isMinimized?: boolean;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ 
  closeMenu,
  isMinimized = false
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
    { href: '/memory', icon: MemoryIcon, label: 'Memória' },
    { href: '/tokens', icon: Coins, label: 'Tokens' },
  ];

  return (
    <nav className={cn(
      "flex flex-col h-full transition-all duration-300",
      isMinimized ? "items-center" : "items-stretch"
    )}>
      <div className="flex-1 space-y-1 p-2">
        {navigationItems.map((item) => (
          <SidebarNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isMinimized={isMinimized}
            onClick={closeMenu}
          />
        ))}
      </div>
      
      {user && (
        <div className="px-2 py-1">
          <TokenDisplay />
        </div>
      )}

      <div className="p-2 border-t border-white/10">
        {user ? (
          <Button
            variant="ghost"
            className={cn(
              "justify-center text-white/70 hover:text-white hover:bg-white/5 w-full",
              isMinimized ? "p-2" : "rounded-xl px-4 py-3 h-12"
            )}
            onClick={handleSignOut}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
            {!isMinimized && <span className="ml-3">Sair</span>}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "justify-center text-white/70 hover:text-white hover:bg-white/5 w-full",
              isMinimized ? "p-2" : "rounded-xl px-4 py-3 h-12"
            )}
            onClick={() => {
              navigate('/auth');
              if (closeMenu) closeMenu();
            }}
            title="Entrar"
          >
            <LogIn className="h-5 w-5" />
            {!isMinimized && <span className="ml-3">Entrar</span>}
          </Button>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
