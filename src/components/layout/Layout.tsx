
import React from 'react';
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
