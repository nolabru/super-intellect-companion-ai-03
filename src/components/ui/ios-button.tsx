
import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface IOSButtonProps extends ButtonProps {
  isActive?: boolean;
  activeColor?: 'blue' | 'purple' | 'gray';
  withBlur?: boolean;
}

const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ 
    className, 
    isActive, 
    activeColor = 'blue',
    withBlur = true,
    variant = "ghost",
    size = "icon",
    ...props 
  }, ref) => {
    const activeStyles = {
      'blue': 'text-inventu-blue hover:text-inventu-blue hover:bg-inventu-blue/10',
      'purple': 'text-inventu-purple hover:text-inventu-purple hover:bg-inventu-purple/10',
      'gray': 'text-inventu-gray hover:text-inventu-gray hover:bg-inventu-gray/10'
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "relative transition-all duration-200",
          "active:scale-95",
          "disabled:opacity-50",
          withBlur && "backdrop-blur-sm",
          isActive && activeStyles[activeColor],
          className
        )}
        {...props}
      />
    );
  }
);

IOSButton.displayName = 'IOSButton';

export { IOSButton };
