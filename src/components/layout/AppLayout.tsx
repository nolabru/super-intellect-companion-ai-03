
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ConversationSidebar from '../ConversationSidebar';
import AppHeader from '../AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(!useIsMobile());
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-[100vh] w-full overflow-hidden bg-inventu-darker">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden relative">
        <ConversationSidebar 
          onToggleSidebar={toggleSidebar}
          isOpen={sidebarOpen}
        />
        
        <main className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          "bg-inventu-dark md:rounded-xl md:m-2",
          isMobile && sidebarOpen && "opacity-50"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
