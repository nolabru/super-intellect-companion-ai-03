
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, sessionLoading } = useAuth();
  const location = useLocation();

  // Mostrar indicador de carregamento enquanto verifica o estado da sessão
  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-inventu-darker">
        <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
      </div>
    );
  }

  // Redirecionar para a página de login se o usuário não estiver autenticado
  if (!user) {
    // Salvar a URL atual para redirecionar de volta após o login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Renderizar o conteúdo protegido se o usuário estiver autenticado
  return <>{children}</>;
};

export default ProtectedRoute;
