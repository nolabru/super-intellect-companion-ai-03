
import React from 'react';
import { MessagesSquare } from 'lucide-react';

interface CompareModelsButtonProps {
  onClick: () => void;
}

const CompareModelsButton: React.FC<CompareModelsButtonProps> = ({ onClick }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <div className="flex flex-col items-center">
        <button
          onClick={onClick}
          className="bg-inventu-card hover:bg-inventu-gray/50 text-white px-4 py-3 rounded-lg border border-inventu-gray/30 transition-colors flex flex-col items-center"
        >
          <span className="font-medium">Comparar</span>
          <span className="text-xs text-gray-400">Comparar modelos</span>
        </button>
        
        <button
          onClick={onClick}
          className="mt-4 btn-secondary bg-transparent border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10 flex items-center gap-2"
        >
          <MessagesSquare size={18} />
          <span>Comparar</span>
        </button>
      </div>
    </div>
  );
};

export default CompareModelsButton;
