
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Cpu,
  Home,
  Settings,
  Shield,
  Users,
  ChevronLeft,
  MessageSquare,
  Newspaper,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onToggleSidebar,
  activeSection,
  onSectionChange
}) => {
  const navigate = useNavigate();

  const sidebarItems = [
    { id: 'overview', label: 'Visão Geral', icon: <Home className="h-5 w-5" /> },
    { id: 'users', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { id: 'plans', label: 'Planos', icon: <Shield className="h-5 w-5" /> },
    { id: 'models', label: 'Modelos', icon: <Cpu className="h-5 w-5" /> },
    { id: 'posts', label: 'Newsletter', icon: <Newspaper className="h-5 w-5" /> },
    { id: 'stats', label: 'Estatísticas', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="h-5 w-5" /> }
  ];

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  const navigateToHome = () => {
    navigate('/');
  };

  const navigateToAnalytics = () => {
    navigate('/analytics');
  };

  return (
    <div className={cn(
      "h-full bg-inventu-dark border-r border-white/10 overflow-y-auto",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 flex justify-between items-center">
        <div className={cn(
          "flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all",
          isOpen ? "w-auto" : "w-0"
        )}>
          <div className="bg-inventu-blue rounded-full p-1 flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-bold text-white">Admin Panel</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onToggleSidebar}
        >
          <ChevronLeft className={cn("h-5 w-5", !isOpen && "rotate-180")} />
        </Button>
      </div>

      <nav className="mt-4 space-y-1 px-2">
        {sidebarItems.map(item => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start mb-1",
              activeSection === item.id
                ? "bg-inventu-blue/20 text-inventu-blue"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={() => handleSectionClick(item.id)}
          >
            <div className="flex items-center">
              {item.icon}
              {isOpen && <span className="ml-3">{item.label}</span>}
            </div>
          </Button>
        ))}
        
        <Button
          variant="ghost"
          className="w-full justify-start mb-1 text-white/70 hover:text-white hover:bg-white/10"
          onClick={navigateToAnalytics}
        >
          <div className="flex items-center">
            <BarChart className="h-5 w-5" />
            {isOpen && <span className="ml-3">Analytics</span>}
          </div>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start mb-1 text-white/70 hover:text-white hover:bg-white/10 mt-4"
          onClick={navigateToHome}
        >
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5" />
            {isOpen && <span className="ml-3">Voltar ao Chat</span>}
          </div>
        </Button>
      </nav>
    </div>
  );
};

export default AdminSidebar;
