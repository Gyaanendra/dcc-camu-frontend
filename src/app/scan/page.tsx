'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { Radio, Sparkles, RefreshCw, QrCode } from 'lucide-react';

export default function ScanPage() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActiveSession = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSessions();
      const live = res.sessions?.find((s: any) => s.isActive === 'true');
      setActiveSession(live || null);
    } catch (err) {
      console.warn('Failed to load active session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            {/* Header with Auto-Detected Session Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Attendance Check-in
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Live QR Attendance Scanner
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Auto-detects active session directly from QR token or member roll number
                </p>
              </div>

              {/* Automatic Session Detection Status */}
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-8 w-44 rounded-full bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                ) : activeSession ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Radio className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">Live: {activeSession.title}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Auto-Detects via QR</span>
                  </div>
                )}

                <button
                  onClick={fetchActiveSession}
                  className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                  title="Check for newly started sessions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Scanner Card */}
            {isLoading ? (
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
