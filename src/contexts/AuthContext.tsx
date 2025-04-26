import React, { createContext, useState, useEffect, useContext } from 'react';
import { Auth, SupabaseClient, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: any; // Update with proper profile type if available
  loading: boolean;
  sessionLoading: boolean;
  sessionError: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: any) => Promise<void>; // Update with proper profile type
  isAdmin: boolean; // Add the isAdmin property type
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  sessionLoading: true,
  sessionError: null,
  login: async () => {},
  logout: async () => {},
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
  const supabaseClient: SupabaseClient = useSupabaseClient();
  const session: Session | null = useSession();

  useEffect(() => {
    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        if (session) {
          setUser(session.user);
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
  }, [session]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const { data, error } = await supabaseClient
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
  }, [user, supabaseClient]);

  // Add isAdmin property for user roles
  const isAdmin = user?.email?.endsWith('@admin.com') || false;

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
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

  const logout = async () => {
    try {
      setLoading(true);
      await supabaseClient.auth.signOut();
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
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profileData,
        }, { returning: 'minimal' });

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
        logout,
        updateProfile,
        isAdmin, // Add the isAdmin property to the context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
