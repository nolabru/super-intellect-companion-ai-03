
import React from 'react';
import { Link, LinkBreak } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios-button';

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
  return (
    <IOSButton
      onClick={onToggleLink}
      isActive={isLinked}
      activeColor="green"
      aria-label={isLinked ? "Unlink conversations" : "Link conversations"}
      className="flex-shrink-0"
      disabled={disabled}
    >
      {isLinked ? <Link size={20} /> : <LinkBreak size={20} />}
    </IOSButton>
  );
};

export default LinkToggleButton;
