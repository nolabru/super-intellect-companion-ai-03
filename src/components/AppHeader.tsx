
import React from 'react';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import ModeSelector, { ChatMode } from '@/components/ModeSelector';
import TokenDisplay from '@/components/TokenDisplay';

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activeMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  activeMode = "text",
  onModeChange = () => {}
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="
      flex items-center justify-between w-full px-2 md:px-4 py-2 
      border-b border-inventu-blue/20 bg-inventu-darker/95 backdrop-blur-xl 
      sticky top-0 z-40 shadow-md animate-fade-in h-[60px]
    ">
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="text-inventu-blue/75 hover:text-inventu-blue hover:bg-inventu-blue/10 rounded-full h-9 w-9 mr-1"
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen
              ? <ChevronLeft className="h-5 w-5" />
              : <Menu className="h-5 w-5" />
            }
          </Button>
        )}

        <Link to="/" className="flex items-center min-w-0">
          <img
            src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png"
            alt="InventuAi Logo"
            className="h-7 max-w-[90px]"
          />
        </Link>
      </div>

      <div className="flex-1 flex justify-center mx-1">
        {onModeChange && (
          <ModeSelector
            activeMode={activeMode}
            onChange={onModeChange}
            className="max-w-[240px]"
          />
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <div className="hidden md:block">
          <TokenDisplay />
        </div>
        <UserMenu />
      </div>
    </header>
  );
};

export default AppHeader;
