'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { Skeleton } from '@/components/ui/skeleton';
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
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            {/* Focused header */}
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border text-foreground">
                <QrCode className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-foreground text-balance">
                  Scan attendance
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Point the camera at a member QR badge to check in.
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchActiveSession}
                title="Check for newly started sessions"
                className="focus-orange shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Live session line */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-8 w-44 rounded-full" />
              ) : activeSession ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[13px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Radio className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[220px]">Live: {activeSession.title}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-[13px] font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-detects session via QR</span>
                </div>
              )}
            </div>

            {/* Capture card (advisors are view-only — scanning disabled) */}
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
              <div className="rounded-lg bg-card border border-border overflow-hidden" aria-label="Loading scanner">
                <Skeleton className="h-[300px] sm:h-[340px] w-full rounded-none" />
                <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ) : (
              <QRScannerModal activeSessionId={activeSession?.id} />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
