
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostDetailHeaderProps {
  onBack?: () => void;
}

const PostDetailHeader: React.FC<PostDetailHeaderProps> = ({ onBack }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/feed');
    }
  };
  
  return (
    <div className="sticky top-16 z-10 px-4 py-2 bg-inventu-darker border-b border-white/5">
      <Button
        variant="ghost"
        size="sm"
        className="text-white/70"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para o feed
      </Button>
    </div>
  );
};

export default PostDetailHeader;
