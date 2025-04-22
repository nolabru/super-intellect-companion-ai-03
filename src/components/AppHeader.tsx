
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import ModeSelector, { ChatMode } from '@/components/ModeSelector';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activeMode?: ChatMode; // Make optional
  onModeChange?: (mode: ChatMode) => void; // Make optional
}

const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  activeMode = 'text', // Provide default value
  onModeChange = () => {} // Provide default empty function
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col py-2 px-2 md:px-6 border-b border-inventu-blue/20 bg-inventu-darker/90 backdrop-blur-xl sticky top-0 z-40 shadow-md animate-fade-in w-full"
      style={{ minHeight: isMobile ? 80 : 90 }}>
      {/* TOP BAR */}
      <div className="flex items-center justify-between w-full min-w-0">
        <div className="flex items-center min-w-0">
          {isMobile && onToggleSidebar && (
            <Button
              onClick={onToggleSidebar}
              size="icon"
              variant="ghost"
              className="mr-2 text-inventu-blue/75 hover:text-inventu-blue hover:bg-inventu-blue/10 rounded-full h-10 w-10 transition-transform hover:scale-105 active:scale-95 duration-150"
              title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ?
                <ChevronLeft className="h-6 w-6" /> :
                <Menu className="h-6 w-6" />
              }
            </Button>
          )}

          <Link to="/" className="flex items-center hover:scale-105 active:scale-95 transition-transform min-w-0">
            <img
              src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png"
              alt="InventuAi Logo"
              className="h-8 md:h-10 max-w-[110px] md:max-w-none"
              style={{ filter: "drop-shadow(0 2px 12px #2563EB44)" }}
            />
          </Link>

          {!sidebarOpen && onToggleSidebar && !isMobile && (
            <Button
              onClick={onToggleSidebar}
              size="icon"
              variant="ghost"
              className="ml-3 text-inventu-blue/60 hover:text-inventu-blue hover:bg-inventu-blue/10 rounded-full h-10 w-10 transition-transform hover:scale-105 active:scale-95"
              title="Abrir menu"
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <UserMenu />
        </div>
      </div>
      
      {/* Only show mode selector if we have an onModeChange handler */}
      {onModeChange && (
        <div className="flex items-center justify-center mt-2">
          <ModeSelector
            activeMode={activeMode}
            onChange={onModeChange}
            className="mx-auto"
          />
        </div>
      )}
    </div>
  );
};

export default AppHeader;
