
import React from 'react';
import UserMenu from './UserMenu';

const AppHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-inventu-gray/30 bg-inventu-darker">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/24d140fc-2d5c-4083-86b6-c8263f7f5d0b.png" 
          alt="InventuAi Logo" 
          className="h-16" 
        />
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
