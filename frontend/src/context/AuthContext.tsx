'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Workspace, AuthState } from '@/types';
import { authApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    workspace: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      const { user, workspace } = response.data.data;
      setState({
        user,
        workspace,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState({
        user: null,
        workspace: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    // Redirect logic
    if (!state.isLoading) {
      const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/invoice/'));
      
      if (!state.isAuthenticated && !isPublicPath) {
        router.push('/login');
      }
      
      if (state.isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
        // Redirect to onboarding if no workspace, otherwise dashboard
        if (!state.workspace) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [state.isAuthenticated, state.isLoading, state.workspace, pathname, router]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user } = response.data.data;
    
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
    
    // Refresh to get workspace
    await refreshUser();
  };

  const signup = async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    const response = await authApi.signup(data);
    const { user } = response.data.data;
    
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
  };

  const logout = async () => {
    await authApi.logout();
    setState({
      user: null,
      workspace: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshUser }}>
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