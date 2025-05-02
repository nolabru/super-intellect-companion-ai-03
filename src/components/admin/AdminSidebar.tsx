import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, CreditCard, LineChart, BarChart3, FileText, Settings, Package, Coins } from 'lucide-react';
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
  const navItems = [{
    id: 'overview',
    label: 'Visão Geral',
    icon: <LayoutDashboard className="h-5 w-5" />
  }, {
    id: 'users',
    label: 'Usuários',
    icon: <Users className="h-5 w-5" />
  }, {
    id: 'plans',
    label: 'Planos',
    icon: <CreditCard className="h-5 w-5" />
  }, {
    id: 'models',
    label: 'Modelos',
    icon: <Package className="h-5 w-5" />
  }, {
    id: 'posts',
    label: 'Publicações',
    icon: <FileText className="h-5 w-5" />
  }, {
    id: 'tokens',
    label: 'Tokens',
    icon: <Coins className="h-5 w-5" />
  }, {
    id: 'stats',
    label: 'Estatísticas',
    icon: <LineChart className="h-5 w-5" />
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />
  }, {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="h-5 w-5" />
  }];
  return <aside className={cn("bg-inventu-darker h-screen flex flex-col border-r border-r-white/10 transition-all duration-300 ease-in-out", isOpen ? "w-64" : "w-16")}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-b-white/10">
        {isOpen && <h1 className="text-lg font-semibold">Administrador</h1>}
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8 rounded-full">
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map(item => <li key={item.id}>
              <Button variant="ghost" className={cn("w-full justify-start gap-3", activeSection === item.id ? "bg-inventu-blue text-white" : "text-white/70 hover:text-white")} onClick={() => onSectionChange(item.id)}>
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </Button>
            </li>)}
        </ul>
      </nav>
    </aside>;
};
export default AdminSidebar;