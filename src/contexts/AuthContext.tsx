
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] Initializing auth state");
    
    // Get the initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log(`[AuthProvider] Initial session check: ${data.session ? 'Logged in' : 'Not logged in'}`);
        
        // Only set session and user if we actually have a session
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[AuthProvider] Error getting initial session:', error);
        setLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`[AuthProvider] Auth state changed: ${event}`);
        
        if (event === 'SIGNED_IN') {
          console.log(`[AuthProvider] User signed in: ${newSession?.user?.id}`);
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          console.log(`[AuthProvider] User signed out`);
          setSession(null);
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log(`[AuthProvider] Token refreshed for user: ${newSession?.user?.id}`);
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else if (event === 'USER_UPDATED') {
          console.log(`[AuthProvider] User updated: ${newSession?.user?.id}`);
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log("[AuthProvider] Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("[AuthProvider] Signing out");
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[AuthProvider] Error during sign out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
