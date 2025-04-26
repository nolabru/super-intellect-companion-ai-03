
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-media-query';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  title?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen, onToggleSidebar, title }) => {
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  return (
    <div className="flex items-center justify-between py-2 sm:py-3 px-4 sm:px-6 border-b border-inventu-gray/30 bg-inventu-darker">
      <div className="flex items-center">
        {!isDesktop && onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="mr-3 text-inventu-gray hover:text-white hover:bg-inventu-gray/20 touch-target"
            title="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png" 
            alt="InventuAi Logo" 
            className="h-10 sm:h-14" 
          />
        </Link>
        
        {!sidebarOpen && isDesktop && onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="ml-3 text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
            title="Abrir menu"
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </Button>
        )}
        
        {title && (
          <div className="ml-4 border-l border-inventu-gray/30 pl-4 hidden sm:block">
            <h1 className="font-medium text-white">{title}</h1>
          </div>
        )}
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
