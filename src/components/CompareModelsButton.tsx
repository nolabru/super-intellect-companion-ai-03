
import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompareModelsButtonProps {
  onClick: () => void;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ onClick }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <Button
        onClick={onClick}
        className="bg-transparent border border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10 flex items-center gap-2"
      >
        <MessagesSquare size={18} />
        <span>Comparar</span>
      </Button>
    </div>
  );
};

export default CompareModelsButton;
