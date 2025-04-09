
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const location = useLocation();
  
  return (
    <div className="flex items-center justify-between py-3 px-6 border-b border-inventu-gray/30 bg-inventu-darker">
      <div className="flex items-center">
        <Link to="/">
          <img 
            src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png" 
            alt="InventuAi Logo" 
            className="h-14" 
          />
        </Link>
        
        {!sidebarOpen && onToggleSidebar && (
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
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
