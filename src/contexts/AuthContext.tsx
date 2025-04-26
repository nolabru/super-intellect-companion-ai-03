
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: User | null;
  profile: any; // Update with proper profile type if available
  loading: boolean;
  sessionLoading: boolean;
  sessionError: Error | null;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; // Renamed from logout to signOut for consistency
  updateProfile: (profile: any) => Promise<void>; // Update with proper profile type
  isAdmin: boolean; // Admin flag
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  sessionLoading: true,
  sessionError: null,
  login: async () => {},
  signOut: async () => {}, // Renamed from logout to signOut
  updateProfile: async () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          setUser(data.session.user);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        setSessionError(error);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setSessionLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          } else {
            setProfile(data);
          }
        } catch (error) {
          console.error('Unexpected error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Add isAdmin property for user roles
  const isAdmin = user?.email?.endsWith('@admin.com') || false;

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setUser(data.user);
      }
    } catch (error: any) {
      console.error('Authentication error:', error.message);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Logout error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profileData,
        }, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      setProfile(profileData);
    } catch (error: any) {
      console.error('Update profile error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        sessionLoading,
        sessionError,
        login,
        signOut, // Renamed from logout to signOut
        updateProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
