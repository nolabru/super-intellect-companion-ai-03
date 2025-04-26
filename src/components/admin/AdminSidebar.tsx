
import React from 'react';
import { Users, CreditCard, Settings, BarChart2, Database, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent, 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
      icon: Home,
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

  // For mobile view
  const MobileSidebar = () => (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onToggleSidebar()}>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0 bg-inventu-dark border-inventu-gray/30">
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
                    "w-full justify-start",
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

  // For desktop view
  const DesktopSidebar = () => (
    <SidebarProvider defaultOpen={isOpen}>
      <Sidebar className="hidden md:flex bg-inventu-dark border-r border-inventu-gray/30" data-state={isOpen ? 'expanded' : 'collapsed'}>
        <SidebarHeader className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold truncate text-white">Painel Admin</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-inventu-gray">Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      isActive={activeSection === item.id}
                      tooltip={item.title}
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        activeSection === item.id 
                          ? "bg-inventu-blue text-white" 
                          : "text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
};

export default AdminSidebar;
