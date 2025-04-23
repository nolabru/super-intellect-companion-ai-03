
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isMinimized?: boolean;
  onClick?: () => void;
}

const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({
  href,
  icon: Icon,
  label,
  isMinimized = false,
  onClick
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === href;

  const handleClick = () => {
    navigate(href);
    if (onClick) onClick();
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-center text-base font-medium transition-all duration-200",
        "hover:bg-white/5 hover:backdrop-blur-lg",
        "active:scale-95",
        "rounded-xl px-4 py-3 h-12",
        isActive ? "bg-white/10 text-white" : "text-white/70",
        !isMinimized && "justify-start"
      )}
      onClick={handleClick}
      title={isMinimized ? label : undefined}
    >
      <Icon className={cn(
        "h-5 w-5",
        !isMinimized && "mr-3"
      )} />
      {!isMinimized && <span className="truncate">{label}</span>}
    </Button>
  );
};

export default SidebarNavLink;
