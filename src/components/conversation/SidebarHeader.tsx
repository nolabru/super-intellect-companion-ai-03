
import React from 'react';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from './SidebarNavigation';
import { toast } from 'sonner';

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
  const handleNewConversation = () => {
    if (!isUserLoggedIn) {
      toast.error('Você precisa estar logado para criar uma nova conversa');
      return;
    }
    onNewConversation();
  };

  return (
    <div className="
      flex flex-col gap-4 px-6 pt-8 pb-4
      border-b border-inventu-gray/20 bg-white/10 dark:bg-inventu-dark/20
      rounded-tr-3xl
      shadow-none
    ">
      <div className="flex items-center gap-2 w-full">
        <Button
          onClick={handleNewConversation}
          className="
            flex-1 h-12 rounded-full text-base 
            bg-inventu-blue/90
            hover:bg-inventu-blue transition-all
            font-semibold shadow-none
            active:scale-95
          "
          disabled={!isUserLoggedIn}
        >
          <PlusCircle className="mr-2 h-6 w-6" />
          Nova Conversa
        </Button>
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="ml-2 text-inventu-gray hover:text-inventu-blue transition-colors rounded-full"
            title="Minimizar menu"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
      </div>
      {/* Navegação limpa abaixo */}
      <SidebarNavigation closeMenu={onToggleSidebar} />
    </div>
  );
};

export default SidebarHeader;

