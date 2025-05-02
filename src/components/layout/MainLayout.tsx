
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isTouchDevice?: boolean;
  title?: string;
  showHeader?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebarOpen = false,
  onToggleSidebar,
  isTouchDevice = false,
  title,
  showHeader = true
}) => {
  return (
    <div className={cn(
      "flex flex-col h-[100vh] w-full overflow-hidden bg-inventu-darker",
      isTouchDevice && "touch-action-pan-y" // Enable native scrolling on touch devices
    )}>
      {showHeader && (
        <AppHeader 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={onToggleSidebar} 
          title={title}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
