import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPlansManagement from '@/components/admin/AdminPlansManagement';

const AdminPanel: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin && user) {
      toast.success(`Bem-vindo, ${user.email?.split('@')[0]}!`, {
        description: 'Você está no Painel Administrativo',
        duration: 3000,
      });
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Você precisa estar logado para acessar esta página');
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        toast.error('Você não tem permissão para acessar o painel administrativo');
        navigate('/');
        return;
      }
    }
  }, [user, loading, isAdmin, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <AdminUserManagement />;
      case 'plans':
        return <AdminPlansManagement />;
      case 'models':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Configuração de Modelos</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>;
      case 'stats':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Estatísticas e Relatórios</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>;
      case 'settings':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Configurações do Sistema</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>;
      default:
        return <AdminOverview />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-inventu-darker">
        <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AdminHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <div className="flex-1 overflow-auto p-2 md:p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
