
import React from 'react';
import { Button } from '@/components/ui/button';

const AppHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-6 border-b border-inventu-gray/30">
      <h1 className="text-3xl font-bold text-inventu-blue mb-1">Inventu</h1>
      <p className="text-lg text-gray-300 mb-4">Super Agente</p>
      <Button 
        variant="outline" 
        className="btn-secondary text-sm"
      >
        API Diagnostics
      </Button>
    </div>
  );
};

export default AppHeader;
