
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { user, isAdmin, profile } = useAuth();
  const [checkComplete, setCheckComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Set check complete once we have user data
    if (user !== undefined) {
      setCheckComplete(true);
      setLoading(false);
    }
  }, [user]);
  
  return {
    isAdmin,
    checkComplete,
    isLoggedIn: !!user,
    loading
  };
};
