
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnimatedTypingIndicatorProps {
  className?: string;
}

const AnimatedTypingIndicator: React.FC<AnimatedTypingIndicatorProps> = ({ 
  className 
}) => {
  return (
    <div className={`flex items-center ${className || ''}`}>
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-inventu-blue/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="h-2 w-2 bg-inventu-blue/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="h-2 w-2 bg-inventu-blue/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default AnimatedTypingIndicator;
