
import React from 'react';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarNavigation from './SidebarNavigation';
import { useConversation } from '@/hooks/useConversation';
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
  const handleNewConversation = async () => {
    console.log('[SidebarHeader] Iniciando nova conversa');
    
    // Chamar o handler de nova conversa
    await onNewConversation();
  };
  
  return (
    <div className="p-4 border-b border-inventu-gray/30">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleNewConversation}
            className="flex-1 bg-inventu-blue hover:bg-inventu-blue/80 text-white"
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
              className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
              title="Minimizar menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <SidebarNavigation />
      </div>
    </div>
  );
};

export default SidebarHeader;
