
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { profile, loading } = useAuth();
  
  return {
    isAdmin: profile?.is_admin || false,
    loading
  };
};
