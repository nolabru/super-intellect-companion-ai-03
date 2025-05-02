
import React, { ReactNode } from 'react';

interface MainHeaderProps {
  children: ReactNode;
}

const MainHeader: React.FC<MainHeaderProps> = ({ children }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-inventu-darker/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {children}
      </div>
    </header>
  );
};

export default MainHeader;
