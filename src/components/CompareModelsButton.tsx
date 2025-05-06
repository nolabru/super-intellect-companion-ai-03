
import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios-button';

export interface CompareModelsButtonProps {
  isComparing: boolean;
  onToggleCompare: () => void;
  compact?: boolean;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ 
  onToggleCompare, 
  isComparing,
  compact
}) => {
  return (
    <IOSButton
      onClick={onToggleCompare}
      isActive={isComparing}
      activeColor="purple"
      aria-label={isComparing ? "Disable model comparison" : "Enable model comparison"}
      className="flex-shrink-0"
    >
      <MessagesSquare size={20} />
    </IOSButton>
  );
};

export default CompareModelsButton;
