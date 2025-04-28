
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
    console.log('[SidebarHeader] Iniciando nova conversa');
    
    if (!isUserLoggedIn) {
      toast.error('Você precisa estar logado para criar uma nova conversa');
      return;
    }
    
    onNewConversation();
  };
  
  return (
    <div className={cn(
      "flex flex-col gap-4 p-4",
      "border-b border-slate-200/10"
    )}>
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleNewConversation}
          className={cn(
            "flex-1 bg-white/10 hover:bg-white/20 text-white",
            "transition-all duration-200",
            "backdrop-blur-lg shadow-sm",
            "border border-white/10"
          )}
          disabled={!isUserLoggedIn}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
        
        {onToggleSidebar && (
          <Button
            onClick={onToggleSidebar}
            size="icon"
            variant="ghost"
            className={cn(
              "text-slate-400 hover:text-white",
              "hover:bg-white/10 transition-colors",
              "backdrop-blur-lg"
            )}
            title="Minimizar menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <SidebarNavigation />
    </div>
  );
};

export default SidebarHeader;
