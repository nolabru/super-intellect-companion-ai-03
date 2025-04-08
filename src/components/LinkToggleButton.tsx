
import React from 'react';
import { Link, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinkToggleButtonProps {
  isLinked: boolean;
  onToggleLink: () => void;
}

const LinkToggleButton: React.FC<LinkToggleButtonProps> = ({ isLinked, onToggleLink }) => {
  return (
    <Button
      onClick={onToggleLink}
      className={cn(
        "bg-transparent border flex items-center gap-2 rounded-xl",
        isLinked 
          ? "border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10" 
          : "border-inventu-gray text-inventu-gray hover:bg-inventu-gray/10"
      )}
    >
      {isLinked ? (
        <>
          <Link2Off size={18} />
          <span>Desvincular</span>
        </>
      ) : (
        <>
          <Link size={18} />
          <span>Vincular</span>
        </>
      )}
    </Button>
  );
};

export default LinkToggleButton;
