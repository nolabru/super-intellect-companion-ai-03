
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { cn } from '@/lib/utils';

interface TouchFriendlyButtonProps extends ButtonProps {
  activeClassName?: string;
  touchActiveDelay?: number;
}

/**
 * A button component that provides enhanced touch feedback for mobile users
 * while maintaining normal behavior for desktop users.
 */
const TouchFriendlyButton = React.forwardRef<HTMLButtonElement, TouchFriendlyButtonProps>(
  ({ 
    children, 
    className, 
    activeClassName = "scale-95", 
    touchActiveDelay = 200, 
    ...props 
  }, ref) => {
    const isTouchDevice = useTouchDevice();
    const [isActive, setIsActive] = useState(false);
    
    // Enhanced touch handling for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      setIsActive(true);
      props.onTouchStart?.(e);
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
      // Delay resetting the active state for better feedback
      setTimeout(() => setIsActive(false), touchActiveDelay);
      props.onTouchEnd?.(e);
    };
    
    // For non-touch devices, use mouse events for hover effects
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isTouchDevice) {
        setIsActive(true);
      }
      props.onMouseDown?.(e);
    };
    
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isTouchDevice) {
        setIsActive(false);
      }
      props.onMouseUp?.(e);
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isActive) {
        setIsActive(false);
      }
      props.onMouseLeave?.(e);
    };
    
    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-200", 
          className,
          isActive && activeClassName
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchFriendlyButton.displayName = 'TouchFriendlyButton';

export { TouchFriendlyButton };
