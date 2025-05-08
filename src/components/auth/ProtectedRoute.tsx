
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, sessionLoading } = useAuth();
  
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-inventu-dark">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-inventu-blue" />
          <p className="text-white/80 text-sm">Verificando login...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
