
import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompareModelsButtonProps {
  onClick: () => void;
  isComparing: boolean;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ onClick, isComparing }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <Button
        onClick={onClick}
        className={cn(
          "bg-transparent border flex items-center gap-2",
          isComparing 
            ? "border-inventu-purple text-inventu-purple hover:bg-inventu-purple/10" 
            : "border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10"
        )}
      >
        <MessagesSquare size={18} />
        <span>{isComparing ? "Modo único" : "Comparar"}</span>
      </Button>
    </div>
  );
};

export default CompareModelsButton;
