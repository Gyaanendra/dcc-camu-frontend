'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  position: string;
  role: 'admin' | 'user';
  teamId?: string | null;
  teamName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: 'admin' | 'user') => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserPosition: (position: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const storedToken = localStorage.getItem('dcc_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const res = await api.getMe();
      setUser(res.user);
    } catch (error) {
      console.warn('Failed to restore session:', error);
      localStorage.removeItem('dcc_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email?: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({
        email: email || 's21cseu0001@bennett.edu.in',
        password: password || 'admin123',
      });
      localStorage.setItem('dcc_token', res.token);
      setToken(res.token);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitchRole = async (targetRole: 'admin' | 'user') => {
    setIsLoading(true);
    try {
      const targetEmail = targetRole === 'admin' ? 's21cseu0001@bennett.edu.in' : 's24cseu0771@bennett.edu.in';
      const targetPassword = targetRole === 'admin' ? 'admin123' : 'user123';
      
      const res = await api.login({ email: targetEmail, password: targetPassword });
      localStorage.setItem('dcc_token', res.token);
      setToken(res.token);
      setUser(res.user);
      toast.success(`Switched active view to ${targetRole.toUpperCase()} mode!`);
    } catch (error: any) {
      toast.error(`Quick switch failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPosition = async (newPosition: string) => {
    try {
      const res = await api.updateProfile({ position: newPosition });
      if (user) {
        setUser({ ...user, position: res.user.position });
      }
      toast.success('Your position title has been updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update position.');
    }
  };

  const logout = () => {
    localStorage.removeItem('dcc_token');
    setUser(null);
    setToken(null);
    toast.info('Logged out from Club DCC Camu.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        quickSwitchRole,
        refreshProfile,
        updateUserPosition,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
