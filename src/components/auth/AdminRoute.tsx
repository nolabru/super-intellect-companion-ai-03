
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAdminCheck();
  const { user, sessionLoading } = useAuth();
  
  if (loading || sessionLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-inventu-blue"></div>
    </div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect to home if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default AdminRoute;
