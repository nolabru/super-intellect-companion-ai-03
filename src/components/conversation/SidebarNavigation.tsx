
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Newspaper, Image, Brain, Coins, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const SidebarNavigation: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  const routes = [
    { 
      path: '/gallery', 
      label: 'Galeria',
      icon: <Image className="h-4 w-4 mr-2" />
    },
    { 
      path: '/memory', 
      label: 'Memória',
      icon: <Brain className="h-4 w-4 mr-2" />
    },
    { 
      path: '/tokens', 
      label: 'Tokens',
      icon: <Coins className="h-4 w-4 mr-2" />
    },
    { 
      path: '/feed', 
      label: 'Newsletter',
      icon: <Newspaper className="h-4 w-4 mr-2" />
    },
    { 
      path: '/analytics', 
      label: 'Analytics',
      icon: <BarChart className="h-4 w-4 mr-2" />
    },
  ];
  
  return (
    <div className="mb-2 px-2">
      <div className="space-y-1">
        {routes.map(({ path, label, icon }) => (
          <Button
            key={path}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start",
              location.pathname === path
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            asChild
          >
            <Link to={path}>
              {icon}
              {label}
            </Link>
          </Button>
        ))}
        
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start",
              location.pathname === '/admin'
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            asChild
          >
            <Link to="/admin">
              <div className="bg-inventu-blue/30 p-1 rounded-full mr-2">
                <div className="h-2 w-2 rounded-full bg-inventu-blue"></div>
              </div>
              Admin
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarNavigation;
