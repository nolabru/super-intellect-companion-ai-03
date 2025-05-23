import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
interface AdminHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  title?: string;
}
const AdminHeader: React.FC<AdminHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  title
}) => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-inventu-gray/30 bg-inventu-dark px-4 md:px-6 w-full">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="bg-transparent text-inventu-light text-base">
        <span className="sr-only">Toggle Menu</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </Button>
      
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <img src="/lovable-uploads/b1250762-3348-4894-88d0-86f5c9aa1709.png" alt="InventuAi Logo" className="h-8 w-auto" />
        </Link>
        
        {title && <div className="md:block ml-4">
            <div className="flex items-center gap-1">
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[14px] font-medium text-white/90 mx-[5px]">{title}</span>
            </div>
          </div>}
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-inventu-gray" />
          <Input type="search" placeholder="Buscar..." className="w-64 rounded-lg pl-8 bg-inventu-darker border-inventu-gray/30 placeholder:text-inventu-gray/70" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-inventu-gray hover:text-white hover:bg-inventu-gray/20">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Novo usuário cadastrado</DropdownMenuItem>
            <DropdownMenuItem>Novo pagamento recebido</DropdownMenuItem>
            <DropdownMenuItem>Atualização do sistema disponível</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-inventu-gray hover:text-white hover:bg-inventu-gray/20">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="font-medium">{user?.email}</span>
              <span className="text-xs text-muted-foreground">Administrador</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
};
export default AdminHeader;