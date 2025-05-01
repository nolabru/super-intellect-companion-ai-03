
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';

interface MainLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isTouchDevice: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebarOpen,
  onToggleSidebar,
  isTouchDevice
}) => {
  return (
    <div className={cn(
      "flex flex-col h-[100vh] w-full overflow-hidden bg-inventu-darker",
      isTouchDevice && "touch-action-pan-y" // Enable native scrolling on touch devices
    )}>
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
