
import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import ConversationSidebar from '@/components/ConversationSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MemoryManager from '@/components/MemoryManager';
import { Loader2, ChevronDown, Brain } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UserMemory: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading } = useAuth();
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <AppHeader 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={toggleSidebar} 
        title={isMobile ? undefined : "Memória do Usuário"}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - conditionally rendered based on device and state */}
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="fixed bottom-4 left-4 z-30 rounded-full shadow-lg bg-inventu-blue hover:bg-inventu-blue/90 text-white h-14 w-14"
                aria-label="Menu de navegação"
              >
                <ChevronDown className="h-5 w-5 rotate-90" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85%] max-w-[320px] bg-inventu-dark border-inventu-gray/20">
              <ConversationSidebar onToggleSidebar={() => {}} isOpen={true} />
            </SheetContent>
          </Sheet>
        ) : (
          sidebarOpen ? (
            <div className="w-64 flex-shrink-0">
              <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
            </div>
          ) : (
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
          )
        )}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile header - only visible on mobile */}
          {isMobile && (
            <div className={cn(
              "sticky top-0 z-20 px-4 py-3 backdrop-blur-lg transition-all duration-200",
              isScrolled ? "bg-inventu-darker/80 shadow-md" : "bg-transparent"
            )}>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-inventu-blue to-inventu-purple p-2 rounded-full">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <h1 className={cn(
                    "font-semibold transition-all duration-200",
                    isScrolled ? "text-xl text-white" : "text-2xl text-white"
                  )}>Memória</h1>
                </div>
              </div>
            </div>
          )}

          {/* Content container with padding optimized for both mobile and desktop */}
          <div className={cn(
            "flex-1 mx-auto w-full max-w-3xl pb-safe",
            isMobile ? "px-4 pt-2 pb-24" : "px-8 py-8"
          )}>
            {!isMobile && (
              <h1 className="text-2xl font-bold mb-6 text-white">Gestão de Memória do Usuário</h1>
            )}
            
            {!isMobile && (
              <p className="mb-6 text-gray-300">
                Este sistema aprende automaticamente sobre você a partir das conversas e lembra informações importantes para futuros diálogos.
                Você também pode adicionar, editar ou excluir itens de memória manualmente abaixo.
              </p>
            )}
            
            <MemoryManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMemory;
