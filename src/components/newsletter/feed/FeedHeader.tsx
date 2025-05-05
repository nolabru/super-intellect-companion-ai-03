
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeedHeaderProps {
  isAdmin: boolean;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({ isAdmin }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-white">Newsletter</h1>
      {isAdmin && (
        <Button 
          variant="default" 
          onClick={() => navigate('/feed/new')} 
          className="bg-inventu-blue hover:bg-inventu-blue/80 flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Publicação
        </Button>
      )}
    </div>
  );
};
