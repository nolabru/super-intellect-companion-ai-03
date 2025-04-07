
import React from 'react';
import UserMenu from './UserMenu';

const AppHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-inventu-gray/30 bg-inventu-darker">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/5ba95823-628d-4cf9-bb1b-05ee42b0730f.png" 
          alt="InventuAi Logo" 
          className="h-12"
        />
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
