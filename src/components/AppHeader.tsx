
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center justify-between py-2 px-3 md:px-6 border-b border-white/5 bg-inventu-darker backdrop-blur-lg sticky top-0 z-40">
      <div className="flex items-center">
        {isMobile && onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="mr-2 text-white/70 hover:text-white hover:bg-white/5 rounded-full h-9 w-9"
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen ? 
              <ChevronLeft className="h-5 w-5" /> : 
              <Menu className="h-5 w-5" />
            }
          </Button>
        )}
        
        <Link to="/">
          <img 
            src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png" 
            alt="InventuAi Logo" 
            className="h-8 md:h-10" 
          />
        </Link>
        
        {!sidebarOpen && onToggleSidebar && !isMobile && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="ml-3 text-white/60 hover:text-white hover:bg-white/5 rounded-full h-9 w-9"
            title="Abrir menu"
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </Button>
        )}
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
