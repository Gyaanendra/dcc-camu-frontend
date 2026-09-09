'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { Radio, Sparkles, RefreshCw, QrCode, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ScanPage() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActiveSession = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSessions();
      const live = res.sessions?.find((s: any) => s.isActive === 'true');
      setActiveSession(live || null);
    } catch (err) {
      // No live session — the scanner auto-detects via QR instead.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
            {/* Header with Auto-Detected Session Badge */}
            <Card className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Attendance Check-in
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
                  <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  Live QR Attendance Scanner
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-detects active session directly from QR token or member roll number
                </p>
              </div>

              {/* Automatic Session Detection Status */}
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-8 w-44 rounded-full bg-secondary animate-pulse" />
                ) : activeSession ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Radio className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">Live: {activeSession.title}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-sm font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Auto-Detects via QR</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchActiveSession}
                  title="Check for newly started sessions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </Card>

            {/* Scanner Card (advisors are view-only — scanning disabled) */}
            {user?.role === 'advisor' ? (
              <Card className="p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-foreground">View-only access</h2>
                <p className="text-sm text-muted-foreground">
                  Advisor accounts cannot mark attendance. Scanning is disabled for your role.
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
              </Card>
            ) : isLoading ? (
              <PageLoader message="Initializing live QR scanner..." />
            ) : (
              <QRScannerModal activeSessionId={activeSession?.id} />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
