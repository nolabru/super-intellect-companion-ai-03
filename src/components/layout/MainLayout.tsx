
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from "@/components/ui/switch";
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Image as ImageIcon } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isTouchDevice: boolean;
  title?: string; // Add optional title prop
  showHeader?: boolean; // Add optional showHeader prop
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebarOpen,
  onToggleSidebar,
  isTouchDevice,
  title,
  showHeader = true
}) => {
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 bg-inventu-darker border-b border-white/10 py-2 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-inventu-gray/20 hover:bg-inventu-gray/30 transition-colors"
          >
            <Sidebar className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Use NavigationMenu for dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-inventu-gray/20 hover:bg-inventu-gray/30 py-2 px-3 flex items-center gap-2">
                    <ImageIcon size={20} />
                    <span className="hidden md:inline text-sm font-medium">Geração de Mídia</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-inventu-dark border-inventu-gray/30">
                    <ul className="flex flex-col p-2 w-[200px]">
                      <li className="p-1">
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/image-generator" 
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-inventu-gray/20 transition-colors"
                          >
                            <ImageIcon size={16} />
                            <span>Gerador de Imagens</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li className="p-1">
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/ideogram" 
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-inventu-gray/20 transition-colors"
                          >
                            <ImageIcon size={16} />
                            <span>Ideogram</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto touch-action-pan-y">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
