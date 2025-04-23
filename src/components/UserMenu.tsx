
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import TokenDisplay from './TokenDisplay';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    return (
      <Button 
        variant="outline" 
        onClick={() => navigate('/auth')}
        className="text-white border-inventu-gray/30 hover:bg-inventu-blue/20"
      >
        Entrar
      </Button>
    );
  }

  // Obter as iniciais do email para o avatar
  const getInitials = () => {
    if (!user.email) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex items-center gap-3">
      <TokenDisplay />
      
      <div className="flex gap-2">
        <Avatar className="h-8 w-8 bg-inventu-blue">
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="text-white border-inventu-gray/30 hover:bg-inventu-red/20"
        >
          Sair
        </Button>
      </div>
    </div>
  );
};

export default UserMenu;
