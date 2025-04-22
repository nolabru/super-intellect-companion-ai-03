
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
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  activeMode,
  onModeChange
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="
      flex items-center justify-between w-full px-2 md:px-6 py-2 md:py-3
      border-b border-inventu-blue/20 bg-inventu-darker/90 backdrop-blur-xl 
      sticky top-0 z-40 shadow-md animate-fade-in
    " style={{ minHeight: isMobile ? 72 : 80 }}>
      {/* Esquerda: Botão menu (só mobile) + logo */}
      <div className="flex items-center min-w-0 gap-2">
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="text-inventu-blue/75 hover:text-inventu-blue hover:bg-inventu-blue/10 rounded-full h-10 w-10 transition-transform hover:scale-105 active:scale-95"
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen
              ? <ChevronLeft className="h-6 w-6" />
              : <Menu className="h-6 w-6" />
            }
          </Button>
        )}

        <Link to="/" className="
          flex items-center hover:scale-105 active:scale-95 transition-transform min-w-0
        ">
          <img
            src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png"
            alt="InventuAi Logo"
            className="h-8 md:h-10 max-w-[104px]"
            style={{ filter: "drop-shadow(0 2px 12px #2563EB44)" }}
          />
        </Link>
      </div>

      {/* Centro: Seletores de modo */}
      <div className="flex-1 flex justify-center">
        <ModeSelector
          activeMode={activeMode}
          onChange={onModeChange}
        />
      </div>

      {/* Direita: Usuário */}
      <div className="flex items-center gap-2 md:gap-3">
        <UserMenu />
      </div>
    </header>
  );
};

export default AppHeader;
