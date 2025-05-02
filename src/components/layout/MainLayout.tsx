
import React, { ReactNode } from 'react';
import MainHeader from './MainHeader';
import UserMenu from '../UserMenu';
import { ModeToggle } from '../ModeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isTouchDevice?: boolean;
  fullHeight?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  sidebarOpen,
  onToggleSidebar,
  isTouchDevice = false,
  fullHeight = true,
}) => {
  return (
    <div className={`flex flex-col ${fullHeight ? 'min-h-screen' : ''}`}>
      <MainHeader>
        <div className="flex items-center">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="mr-2"
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          {title && (
            <h1 className="text-xl font-medium text-white">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </MainHeader>
      
      {/* Conteúdo principal com padding padronizado */}
      <div className="flex-1 p-6">
        {title && !onToggleSidebar && (
          <h1 className="text-xl font-medium text-white mb-6">{title}</h1>
        )}
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
