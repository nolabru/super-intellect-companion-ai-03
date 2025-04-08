
import React from 'react';
import UserMenu from './UserMenu';

const AppHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between py-3 px-6 border-b border-inventu-gray/30 bg-inventu-darker">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/660fd82c-2d2a-4cb2-af97-53ee892865f4.png" 
          alt="InventuAi Logo" 
          className="h-20" 
        />
      </div>
      
      <UserMenu />
    </div>
  );
};

export default AppHeader;
