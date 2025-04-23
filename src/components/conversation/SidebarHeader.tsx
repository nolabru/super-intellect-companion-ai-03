
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from './SidebarNavigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  onNewConversation: () => void;
  onToggleSidebar?: () => void;
  isUserLoggedIn: boolean;
  isMinimized?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onNewConversation, 
  onToggleSidebar,
  isUserLoggedIn,
  isMinimized = false
}) => {
  const handleNewConversation = () => {
    if (!isUserLoggedIn) {
      toast.error('Você precisa estar logado para criar uma nova conversa');
      return;
    }
    onNewConversation();
  };
  
  return (
    <div className="flex flex-col">
      <div className="p-2 border-b border-white/10">
        <Button 
          onClick={handleNewConversation}
          className={cn(
            "flex items-center justify-center bg-white/5 hover:bg-white/10",
            "text-white font-medium transition-all duration-200",
            "active:scale-95 rounded-xl h-11 w-full",
            "border border-white/10 backdrop-blur-sm",
            isMinimized && "p-0 w-12"
          )}
          disabled={!isUserLoggedIn}
          title="Nova Conversa"
        >
          <PlusCircle className={cn(
            "h-5 w-5",
            !isMinimized && "mr-2"
          )} />
          {!isMinimized && "Nova Conversa"}
        </Button>
      </div>
      
      <SidebarNavigation 
        closeMenu={onToggleSidebar}
        isMinimized={isMinimized}
      />
    </div>
  );
};

export default SidebarHeader;
