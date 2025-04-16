
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { ModeIcon } from "@/components/chat/ModeIcon";
import { useNavigate } from 'react-router-dom';
import TokenDisplay from './TokenDisplay';

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const navigate = useNavigate();
  
  const navigateToGallery = () => {
    navigate('/gallery');
  };
  
  const navigateToHome = () => {
    navigate('/');
  };
  
  return (
    <header className="bg-inventu-dark shadow-md py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-gray-400 hover:text-white"
            onClick={onToggleSidebar}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={sidebarOpen ? "transform rotate-90" : ""}
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <div className="flex items-center space-x-2 mr-2">
            <Button 
              variant="ghost" 
              className="text-lg font-semibold flex items-center space-x-2 text-white"
              onClick={navigateToHome}
            >
              <ModeIcon mode="text" size={24} className="text-inventu-blue" />
              <span>Inventu AI</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <TokenDisplay />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex"
            onClick={navigateToGallery}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2"
            >
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
            </svg>
            Galeria
          </Button>
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
