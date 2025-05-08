import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPlansManagement from '@/components/admin/AdminPlansManagement';
import AdminModelsManagement from '@/components/admin/AdminModelsManagement';
import AdminPostsManagement from '@/components/admin/AdminPostsManagement';
import AdminStats from '@/components/admin/AdminStats';
import AdminSystemSettings from '@/components/admin/AdminSystemSettings';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminTokensManagement from '@/components/admin/AdminTokensManagement';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // Map section names to their display titles
  const getSectionTitle = () => {
    switch(activeSection) {
      case 'overview': return 'Painel Administrativo';
      case 'users': return 'Gerenciamento de Usuários';
      case 'plans': return 'Planos e Assinaturas';
      case 'posts': return 'Gerenciamento de Posts';
      case 'models': return 'Modelos de IA';
      case 'tokens': return 'Gerenciamento de Tokens';
      case 'stats': return 'Estatísticas';
      case 'analytics': return 'Análises';
      case 'settings': return 'Configurações do Sistema';
      default: return 'Painel Administrativo';
    }
  };

  return (
    <div className="flex h-screen bg-inventu-dark text-white">
      <AdminSidebar
        isOpen={isOpen}
        onToggleSidebar={toggleSidebar}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          sidebarOpen={isOpen} 
          onToggleSidebar={toggleSidebar}
          title={getSectionTitle()}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {activeSection === 'overview' && <AdminOverview />}
          {activeSection === 'users' && <AdminUserManagement />}
          {activeSection === 'plans' && <AdminPlansManagement />}
          {activeSection === 'posts' && <AdminPostsManagement />}
          {activeSection === 'models' && <AdminModelsManagement />}
          {activeSection === 'tokens' && <AdminTokensManagement />}
          {activeSection === 'stats' && <AdminStats />}
          {activeSection === 'analytics' && <AdminAnalytics />}
          {activeSection === 'settings' && <AdminSystemSettings />}
        </main>
      </div>
    </div>
  );
};

function getSectionTitle(): string {
  // Move the function definition outside of the component to avoid
  // recreating it on every render
  const activeSection = document.querySelector('[data-active-section]')?.getAttribute('data-active-section') || 'overview';
  
  switch(activeSection) {
    case 'overview': return 'Painel Administrativo';
    case 'users': return 'Gerenciamento de Usuários';
    case 'plans': return 'Planos e Assinaturas';
    case 'posts': return 'Gerenciamento de Posts';
    case 'models': return 'Modelos de IA';
    case 'tokens': return 'Gerenciamento de Tokens';
    case 'stats': return 'Estatísticas';
    case 'analytics': return 'Análises';
    case 'settings': return 'Configurações do Sistema';
    default: return 'Painel Administrativo';
  }
}

export default AdminPanel;
