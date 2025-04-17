
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type GoogleAuthContextType = {
  isGoogleConnected: boolean;
  loading: boolean;
};

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading) {
      // Check if user is connected via Google
      const connected = user?.app_metadata?.provider === 'google';
      setIsGoogleConnected(connected);
      setLoading(false);
    }
  }, [user, authLoading]);

  return (
    <GoogleAuthContext.Provider value={{ 
      isGoogleConnected, 
      loading
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};
