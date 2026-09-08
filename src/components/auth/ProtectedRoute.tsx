'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Loading state with smooth animation
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background font-extrabold text-base shadow-sm animate-pulse">
            DCC
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Verifying Bennett credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Admin access guard
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md p-8 rounded-2xl dash-card text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Admin Access Required
          </h2>
          <p className="text-sm text-muted-foreground">
            This module is restricted to Club DCC Admins and Executives. Your current role is{' '}
            <strong className="text-foreground uppercase font-mono">{user.role}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
