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
  role: 'admin' | 'advisor' | 'user';
  teamId?: string | null;
  teamName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
      const storedToken = localStorage.getItem('dcc_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const res = await api.getMe();
      setUser(res.user);
    } catch (error) {
      console.warn('[Auth] Failed to restore active session:', error);
      localStorage.removeItem('dcc_auth_token');
      api.setToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.login(normalizedEmail, password);
      localStorage.setItem('dcc_auth_token', res.token);
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

  const updateUserPosition = async (newPosition: string) => {
    // Self-editing disabled by admin: positions can only be changed via Member Directory by an admin.
    toast.error('Profile editing is disabled. Please contact an admin to update your details.');
    return;
  };

  const logout = () => {
    localStorage.removeItem('dcc_auth_token');
    api.setToken(null);
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
