import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MemoryManager from '@/components/MemoryManager';
import { Loader2, Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
const UserMemory: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Effect for auth check
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Effect for scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-inventu-darker">
        <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
      </div>;
  }
  return <div className="flex min-h-screen w-full bg-inventu-darker">
      {/* Desktop Sidebar */}
      {!isMobile && <div className={cn("fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity" onClick={toggleSidebar}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark" onClick={e => e.stopPropagation()}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>}

      {/* Main Content */}
      <div className={cn("flex min-h-screen w-full flex-col transition-all duration-300", !isMobile && sidebarOpen && "pl-64")}>
        <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} title="Memória do Usuário" />
        
        <main className="flex-1">
          {/* Mobile Title */}
          {isMobile && <div className={cn("sticky top-16 z-20 px-4 py-3 backdrop-blur-lg transition-all duration-200", isScrolled ? "bg-inventu-darker/80 shadow-md" : "bg-transparent")}>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-inventu-blue to-inventu-purple p-2 rounded-full">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h1 className={cn("font-semibold text-white transition-all duration-200", isScrolled ? "text-xl" : "text-2xl")}>Memória</h1>
                </div>
              </div>
            </div>}

          {/* Content container with padding optimized for both mobile and desktop */}
          <div className="px-0 py-0">
            {!isMobile && <h1 className="text-2xl font-bold mb-4 text-white px-0 mx-0 my-0 py-0">Gestão de Memória do Usuário</h1>}
            
            {!isMobile && <p className="mb-2 text-gray-300 px-0 py-0 my-0 mx-0">
                Este sistema aprende automaticamente sobre você a partir das conversas e lembra informações importantes para futuros diálogos.
                Você também pode adicionar, editar ou excluir itens de memória manualmente abaixo.
              </p>}
            
            <MemoryManager />
          </div>
        </main>
      </div>
    </div>;
};
export default UserMemory;