
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isAdmin: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for mock session in localStorage
    const checkSession = () => {
      const savedUser = localStorage.getItem('mockUser');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAdmin(parsedUser.email === 'admin@example.com');
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate loading
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email
    };
    
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAdmin(email === 'admin@example.com');
    setLoading(false);
  };

  const signUp = async (email: string, password: string) => {
    // Similar implementation to signIn for mock purposes
    await signIn(email, password);
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.removeItem('mockUser');
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
