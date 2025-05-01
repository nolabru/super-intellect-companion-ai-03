
import React from 'react';
import { cn } from '@/lib/utils';
import ConversationSidebar from '../ConversationSidebar';

interface ChatSidebarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  isMobile
}) => {
  if (!sidebarOpen) return null;
  
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && (
        <div 
          className="fixed inset-0 z-30 bg-black/60"
          onClick={onToggleSidebar}
        />
      )}
      
      {/* Sidebar content */}
      <div className={cn(
        isMobile ? "fixed left-0 top-0 bottom-0 z-40 w-64" : "w-64 flex-shrink-0",
        "h-full bg-inventu-darker transition-transform",
        isMobile && !sidebarOpen && "-translate-x-full"
      )}>
        <ConversationSidebar 
          onToggleSidebar={onToggleSidebar} 
          isOpen={true} 
        />
      </div>
    </>
  );
};

export default ChatSidebar;
