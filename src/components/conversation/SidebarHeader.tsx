
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
      flex flex-col gap-3 p-4 
      border-b border-gray-200/40 bg-white/30 dark:bg-inventu-dark/20
      rounded-tr-2xl
      ">
      <div className="flex items-center gap-2 w-full">
        <Button
          onClick={handleNewConversation}
          className="
            flex-1 h-11 rounded-2xl text-base bg-inventu-blue shadow-xl
            hover:bg-inventu-blue/90 transition-all
          "
          disabled={!isUserLoggedIn}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Conversa
        </Button>
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className="ml-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
