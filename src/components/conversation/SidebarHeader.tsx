
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
    <div className="
      flex flex-col gap-2 px-3 pt-4 pb-2
      border-b border-white/5
      bg-inventu-dark/60 backdrop-blur-lg
      dark:bg-inventu-dark/80
    ">
      <div className="flex items-center gap-2 w-full">
        <Button
          onClick={handleNewConversation}
          className="
            flex-1 h-9 rounded-full text-sm
            bg-inventu-blue hover:bg-inventu-blue/90
            font-medium shadow-sm transition-all
            active:scale-[0.98]
          "
          disabled={!isUserLoggedIn}
        >
          <PlusCircle className="mr-1.5 h-4 w-4" />
          Nova Conversa
        </Button>
        {onToggleSidebar && !isMobile && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/5 transition-colors rounded-full"
            title="Minimizar menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <SidebarNavigation closeMenu={onToggleSidebar} />
    </div>
  );
};

export default SidebarHeader;
