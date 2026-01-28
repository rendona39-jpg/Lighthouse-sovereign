'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, SignUpRequest, SignInRequest, AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpRequest) => Promise<AuthResponse>;
  signIn: (data: SignInRequest) => Promise<AuthResponse>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('lighthouse_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('lighthouse_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signUp = useCallback(async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sign up failed');
    }

    const result: AuthResponse = await response.json();
    
    const newUser: User = {
      userId: result.userId,
      orgId: result.orgId,
      fullName: data.fullName,
      email: data.email,
      businessName: result.businessName,
      role: data.role as User['role'],
      location: data.location,
    };

    setUser(newUser);
    localStorage.setItem('lighthouse_user', JSON.stringify(newUser));
    
    return result;
  }, []);

  const signIn = useCallback(async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sign in failed');
    }

    const result: AuthResponse = await response.json();
    
    const newUser: User = {
      userId: result.userId,
      orgId: result.orgId,
      fullName: '', // Will be fetched separately or stored in cookie
      email: data.email,
      businessName: result.businessName,
      role: (result.role as User['role']) || 'Staff',
    };

    setUser(newUser);
    localStorage.setItem('lighthouse_user', JSON.stringify(newUser));
    
    return result;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lighthouse_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
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
