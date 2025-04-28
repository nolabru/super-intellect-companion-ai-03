
import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CompareModelsButtonProps {
  isComparing: boolean;
  onToggleCompare: () => void;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ onToggleCompare, isComparing }) => {
  return (
    <Button
      onClick={onToggleCompare}
      variant="ghost"
      size="icon"
      className={cn(
        "flex-shrink-0",
        isComparing && "text-inventu-purple hover:text-inventu-purple hover:bg-inventu-purple/10"
      )}
    >
      <MessagesSquare size={20} />
    </Button>
  );
};

export default CompareModelsButton;
