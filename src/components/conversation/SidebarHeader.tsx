
import React from 'react';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from './SidebarNavigation';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarHeaderProps {
  onNewConversation: () => void;
  onToggleSidebar?: () => void;
  isUserLoggedIn: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onNewConversation,
  onToggleSidebar,
  isUserLoggedIn
}) => {
  const isMobile = useIsMobile();

  const handleNewConversation = () => {
    if (!isUserLoggedIn) {
      toast.error('Você precisa estar logado para criar uma nova conversa');
      return;
    }
    onNewConversation();
  };

  return (
    <div
      className="
        flex flex-col gap-3 px-2 pb-2 pt-4 md:pt-6
        border-b border-inventu-blue/20
        bg-inventu-dark/90 backdrop-blur-lg
        shadow-md animate-fade-in
      "
    >
      <div className="flex items-center gap-2 w-full">
        <Button
          onClick={handleNewConversation}
          className="
            flex-1 h-11 rounded-full text-base md:text-lg
            bg-inventu-blue hover:bg-inventu-blue/90
            font-semibold shadow-xs transition-all
            hover:scale-105 active:scale-[0.97]
            duration-150
          "
          disabled={!isUserLoggedIn}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Conversa
        </Button>
        {onToggleSidebar && !isMobile && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-inventu-blue/60 hover:text-inventu-blue hover:bg-inventu-blue/10 transition-colors rounded-full hover:scale-105 active:scale-95 duration-150"
            title="Minimizar menu"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
      </div>

      <SidebarNavigation closeMenu={onToggleSidebar} />
    </div>
  );
};

export default SidebarHeader;
