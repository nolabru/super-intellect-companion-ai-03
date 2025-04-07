
import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompareModelsButtonProps {
  onClick: () => void;
  isComparing: boolean;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ onClick, isComparing }) => {
  // This component is now only used in the chat input area
  // The button in the middle of chats has been removed
  return (
    <Button
      onClick={onClick}
      className={cn(
        "bg-transparent border flex items-center gap-2 rounded-xl",
        isComparing 
          ? "border-inventu-purple text-inventu-purple hover:bg-inventu-purple/10" 
          : "border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10"
      )}
    >
      <MessagesSquare size={18} />
      <span>{isComparing ? "Modo único" : "Comparar"}</span>
    </Button>
  );
};

export default CompareModelsButton;
