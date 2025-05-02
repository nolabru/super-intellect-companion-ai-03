import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import TokenDisplay from './TokenDisplay';
import { User, LogOut, Settings } from 'lucide-react';
const UserMenu: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email?.endsWith('@admin.com') || false;
  if (!user) {
    return <Button variant="outline" onClick={() => navigate('/auth')} className="text-white border-inventu-gray/30 text-sm font-medium text-center bg-inventu-card">
        <User className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Entrar</span>
      </Button>;
  }
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return <div className="flex items-center gap-3">
      <TokenDisplay />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8 bg-inventu-blue">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 bg-inventu-dark/95 backdrop-blur-lg border-inventu-gray/30">
          {isAdmin && <DropdownMenuItem onClick={() => navigate('/services')} className="text-white/90 hover:text-white focus:text-white cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Serviços de IA</span>
            </DropdownMenuItem>}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-white/90 hover:text-white focus:text-white cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>;
};
export default UserMenu;