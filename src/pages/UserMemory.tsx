
import React from 'react';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MemoryManager from '@/components/MemoryManager';
import { Loader2 } from 'lucide-react';

const UserMemory: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen ? (
          <div className="w-64 flex-shrink-0">
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        ) : (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}
        
        <div className="flex-1 flex flex-col overflow-auto p-4">
          <div className="max-w-3xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-6 text-white">Gestão de Memória do Usuário</h1>
            <p className="mb-6 text-gray-300">
              Este sistema aprende automaticamente sobre você a partir das conversas e lembra informações importantes para futuros diálogos.
              Você também pode adicionar, editar ou excluir itens de memória manualmente abaixo.
            </p>
            
            <MemoryManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMemory;
