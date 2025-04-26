
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, CreditCard, Settings, BarChart2, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminUserStats from '@/components/admin/AdminUserStats';
import AdminOverview from '@/components/admin/AdminOverview';

const AdminPanel: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in or not admin
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Here you would check if user has admin role
    // For now we're just allowing any authenticated user
  }, [user, loading, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Gestão de Usuários</h2><p className="text-muted-foreground">Implementação pendente</p></div>;
      case 'plans':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Gestão de Planos</h2><p className="text-muted-foreground">Implementação pendente</p></div>;
      case 'models':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Configuração de Modelos</h2><p className="text-muted-foreground">Implementação pendente</p></div>;
      case 'settings':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Configurações do Sistema</h2><p className="text-muted-foreground">Implementação pendente</p></div>;
      case 'stats':
        return <div className="p-4"><h2 className="text-2xl font-bold mb-4">Estatísticas e Relatórios</h2><p className="text-muted-foreground">Implementação pendente</p></div>;
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
