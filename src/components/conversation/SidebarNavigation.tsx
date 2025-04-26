
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, Image, BrainCircuit, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SidebarNavigationProps {
  closeMenu?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ closeMenu }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    if (closeMenu) {
      closeMenu();
    }
    
    // Se for a rota admin, verificar se é admin
    if (path === '/admin' && !isAdmin) {
      toast.error('Você não tem permissão para acessar o painel administrativo');
      console.log('Tentativa de acesso negado ao painel admin. isAdmin:', isAdmin);
      return;
    }
    
    navigate(path);
  };

  if (!user) {
    return null;
  }

  console.log('SidebarNavigation - User:', user.email, 'isAdmin:', isAdmin);

  const navigationItems = [
    {
      icon: <Image className="w-4 h-4" />,
      label: 'Galeria de Mídia',
      path: '/gallery',
    },
    {
      icon: <BrainCircuit className="w-4 h-4" />,
      label: 'Memória do Usuário',
      path: '/memory',
    },
    {
      icon: <Coins className="w-4 h-4" />,
      label: 'Tokens & Planos',
      path: '/tokens',
    },
  ];

  // Add admin option if user is admin
  if (isAdmin) {
    navigationItems.push({
      icon: <Shield className="w-4 h-4" />,
      label: 'Painel Admin',
      path: '/admin',
    });
  }

  return (
    <div className="border-t border-inventu-gray/30 pt-2 mt-2">
      <div className="grid gap-1">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            onClick={() => handleClick(item.path)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-inventu-gray hover:text-white transition-colors hover:bg-inventu-gray/20"
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SidebarNavigation;
