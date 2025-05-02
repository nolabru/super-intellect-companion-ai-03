
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  title?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen, onToggleSidebar, title }) => {
  const isMobile = useIsMobile();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-inventu-darker/80 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="shrink-0 text-inventu-gray hover:text-white hover:bg-white/10"
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png" 
                alt="InventuAi Logo" 
                className="h-8 w-auto" 
              />
            </Link>
            
            {title && (
              <div className="md:block">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-[24px] font-medium text-white/90">{title}</span>
                </div>
              </div>
            )}
          </div>
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
