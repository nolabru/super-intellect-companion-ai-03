
import React from 'react';
import { Link, Link2Off } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios-button';
import { useIsMobile } from '@/hooks/use-mobile';

export interface LinkToggleButtonProps {
  isLinked: boolean;
  onToggleLink: () => void;
  disabled?: boolean;
}

const LinkToggleButton: React.FC<LinkToggleButtonProps> = ({ 
  isLinked, 
  onToggleLink, 
  disabled 
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) return null;

  return (
    <IOSButton
      onClick={onToggleLink}
      disabled={disabled}
      isActive={isLinked}
      activeColor="blue"
      variant="outline"
      size="default"
      className="gap-2"
      aria-label={isLinked ? "Unlink models" : "Link models"}
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
    </IOSButton>
  );
};

export default LinkToggleButton;
