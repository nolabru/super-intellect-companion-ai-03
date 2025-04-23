
import React from 'react';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from './SidebarNavigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleNewConversation}
            className={cn(
              "flex-1 bg-inventu-blue hover:bg-inventu-blue/90",
              "text-white font-medium transition-all duration-200",
              "active:scale-95 rounded-xl h-11"
            )}
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
              className="text-white/70 hover:text-white hover:bg-white/5 rounded-xl h-11 w-11"
              title="Minimizar menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <SidebarNavigation 
        closeMenu={onToggleSidebar}
      />
    </div>
  );
};

export default SidebarHeader;
