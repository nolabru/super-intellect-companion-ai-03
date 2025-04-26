
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Database, 
  BarChart2, 
  Settings 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const menuItems = [
    {
      id: 'overview',
      title: 'Visão Geral',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      title: 'Usuários',
      icon: Users,
    },
    {
      id: 'plans',
      title: 'Planos',
      icon: CreditCard,
    },
    {
      id: 'models',
      title: 'Modelos',
      icon: Database,
    },
    {
      id: 'stats',
      title: 'Estatísticas',
      icon: BarChart2,
    },
    {
      id: 'settings',
      title: 'Configurações',
      icon: Settings,
    },
  ];

  // Mobile Sidebar
  const MobileSidebar = () => (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onToggleSidebar()}>
      <SheetContent 
        side="left" 
        className="w-[250px] sm:w-[300px] p-0 bg-inventu-dark border-r border-inventu-gray/30"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-inventu-gray/30">
            <h2 className="text-xl font-semibold text-white">Painel Admin</h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    activeSection === item.id 
                      ? "bg-inventu-blue text-white" 
                      : "text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
                  )}
                  onClick={() => {
                    onSectionChange(item.id);
                    onToggleSidebar();
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div 
      className={cn(
        "hidden md:flex flex-col w-64 bg-inventu-dark border-r border-inventu-gray/30 transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-4 border-b border-inventu-gray/30">
        <h2 className={cn(
          "text-xl font-semibold text-white transition-opacity duration-300",
          !isOpen && "opacity-0"
        )}>
          Painel Admin
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                activeSection === item.id 
                  ? "bg-inventu-blue text-white" 
                  : "text-inventu-gray hover:text-white hover:bg-inventu-gray/20",
                !isOpen && "justify-center"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className="h-4 w-4" />
              {isOpen && <span className="ml-2">{item.title}</span>}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
};

export default AdminSidebar;
