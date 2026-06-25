import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSupabaseConfigured = !!supabase;

  // Sync user state from Supabase Auth (or mock localStorage on mount)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock mode fallback
      const storedUser = localStorage.getItem('chatgpt-clone-mock-user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('chatgpt-clone-mock-user');
        }
      }
      setIsLoading(false);
      return;
    }

    // Initialize from active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: metadata.username || '',
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
        });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: metadata.username || '',
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (!isSupabaseConfigured) {
      localStorage.setItem('chatgpt-clone-mock-user', JSON.stringify(updatedUser));
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Mock Sign Up
      const mockUser: User = {
        id: Math.random().toString(36).substring(2),
        email,
        username,
        firstName: '',
        lastName: '',
      };
      setUser(mockUser);
      localStorage.setItem('chatgpt-clone-mock-user', JSON.stringify(mockUser));
      localStorage.setItem('chatgpt-clone-show-welcome', 'true');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const metadata = data.user.user_metadata || {};
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        username: metadata.username || '',
        firstName: metadata.first_name || '',
        lastName: metadata.last_name || '',
      });
      localStorage.setItem('chatgpt-clone-show-welcome', 'true');
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Mock Login
      const mockUser: User = {
        id: 'mock-user-id',
        email,
        username: email.split('@')[0],
        firstName: 'Demo',
        lastName: 'User',
      };
      setUser(mockUser);
      localStorage.setItem('chatgpt-clone-mock-user', JSON.stringify(mockUser));
      localStorage.setItem('chatgpt-clone-show-welcome', 'true');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const metadata = data.user.user_metadata || {};
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        username: metadata.username || '',
        firstName: metadata.first_name || '',
        lastName: metadata.last_name || '',
      });
      localStorage.setItem('chatgpt-clone-show-welcome', 'true');
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      // Mock Logout
      setUser(null);
      localStorage.removeItem('chatgpt-clone-mock-user');
      localStorage.removeItem('chatgpt-clone-active-conversation');
      localStorage.setItem('chatgpt-clone-show-welcome', 'true');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('chatgpt-clone-active-conversation');
    localStorage.setItem('chatgpt-clone-show-welcome', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateUser,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
