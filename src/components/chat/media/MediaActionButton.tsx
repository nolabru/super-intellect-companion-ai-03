
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
}

const MediaActionButton: React.FC<MediaActionButtonProps> = ({
  onClick,
  icon,
  label,
  variant,
  disabled = false,
  loading = false
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Button
      variant={isMobile ? (variant === "primary" ? "default" : "outline") : "ghost"}
      size={isMobile ? "default" : "sm"}
      className={isMobile 
        ? `w-full text-white ${variant === "primary" ? "bg-inventu-blue hover:bg-inventu-blue/90" : "border-white/20 hover:bg-white/10"} py-3` 
        : `text-white text-xs flex items-center hover:text-white ${variant === "primary" ? "hover:bg-inventu-blue/20" : "hover:bg-white/10"}`
      }
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 size={isMobile ? 16 : 12} className={isMobile ? 'mr-2' : 'mr-1'} />
      ) : (
        React.cloneElement(icon as React.ReactElement, { 
          size: isMobile ? 16 : 12, 
          className: isMobile ? 'mr-2' : 'mr-1' 
        })
      )}
      {label}
    </Button>
  );
};

export default MediaActionButton;
