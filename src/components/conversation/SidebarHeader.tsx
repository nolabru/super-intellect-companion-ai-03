
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
      flex flex-col gap-3 px-4 pt-6 pb-3
      border-b border-inventu-gray/10
      bg-white/5 backdrop-blur-xl
      dark:bg-inventu-dark/10
      rounded-tr-2xl md:rounded-tr-3xl
    ">
      <div className="flex items-center gap-2 w-full">
        <Button
          onClick={handleNewConversation}
          className="
            flex-1 h-10 rounded-full text-sm md:text-base
            bg-inventu-blue/90 hover:bg-inventu-blue 
            font-medium shadow-sm transition-all
            active:scale-[0.98]
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
            className="ml-1 text-inventu-gray hover:text-inventu-blue transition-colors rounded-full"
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
