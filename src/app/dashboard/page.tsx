'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  QrCode,
  LayoutDashboard,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  Radio,
  PowerOff,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

function useCountUp(target: number, ms = 700) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'admin' || user?.role === 'advisor') {
        const [data, sessionsRes] = await Promise.all([api.getAdminAnalytics(), api.getSessions()]);
        setAdminAnalytics(data);
        setActiveSessions(sessionsRes.sessions || []);
      } else {
        const [data, sessionsRes] = await Promise.all([api.getMyStats(), api.getSessions()]);
        setUserStats(data);
        setActiveSessions(sessionsRes.sessions || []);
      }
    } catch (error) {
      // Dashboard shows empty states when data fails to load.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleCloseActiveSession = async (sessionId: string) => {
    setIsClosingSession(true);
    try {
      await api.updateSessionStatus(sessionId, { isActive: false });
      toast.success('Live Session QR closed and attendance ended.');
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close session');
    } finally {
      setIsClosingSession(false);
    }
  };

  const activeLiveSession = activeSessions.find(s => s.isActive === 'true');

  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Member';
  const animatedAttendance = useCountUp(userStats?.stats?.attendancePercentage || 0);
  const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const isPrivileged = user?.role === 'admin' || user?.role === 'advisor';

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Dashboard' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">

            {/* ── Notion-Style Gen-Z Student Club Header Banner ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-accent/[0.08] via-card to-amber-500/[0.04] p-5 sm:p-6 shadow-sm">
              {/* Subtle background dot grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.2]"
                style={{
                  backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Decorative Notion Star Sparkles in background */}
              <div className="absolute top-3 right-16 hidden sm:block pointer-events-none opacity-30 text-accent">
                <svg width="24" height="24" viewBox="0 0 42 42" fill="none">
                  <path d="M21 0C21 11.598 11.598 21 0 21C11.598 21 21 30.402 21 42C21 30.402 30.402 21 42 21C30.402 21 21 11.598 21 0Z" fill="currentColor" />
                </svg>
              </div>
              <div className="absolute bottom-3 right-40 hidden sm:block pointer-events-none opacity-20 text-amber-500">
                <svg width="18" height="18" viewBox="0 0 42 42" fill="none">
                  <path d="M21 0C21 11.598 11.598 21 0 21C11.598 21 21 30.402 21 42C21 30.402 30.402 21 42 21C30.402 21 21 11.598 21 0Z" fill="currentColor" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Avatar + Greeting + Club status */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <MemberAvatar
                      src={user?.avatarUrl}
                      name={user?.name}
                      className="h-14 w-14 rounded-2xl border-2 border-background shadow-md ring-4 ring-accent/15"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-card text-white text-[9px] font-bold">
                      ✓
                    </span>
                  </div>

                  <div className="min-w-0">
                    {/* Gen-Z Club Tag Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[11px] font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">
                        ⚡ Club DCC
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
                        Bennett Univ
                      </span>
                      {activeLiveSession && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                          ● Session Live
                        </span>
                      )}
                    </div>

                    <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight truncate">
                      {daypart}, {firstName}! 👋
                    </h1>

                    <p suppressHydrationWarning className="text-xs text-muted-foreground mt-0.5 truncate">
                      {dateLine} · {user?.position || 'Member'} · {user?.teamName || 'Developer Wing'}
                    </p>
                  </div>
                </div>

                {/* Right: Quick actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadDashboardData}
                    id="dashboard-refresh"
                    title="Refresh Data"
                    className="rounded-xl h-9 w-9 bg-card/80 border-border/80 focus-orange"
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Active Session Banner ──────────────────────────── */}
            {activeLiveSession && (
              <Card className="p-4 border-emerald-500/40 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Radio className="w-4 h-4 motion-safe:animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-foreground truncate">{activeLiveSession.title}</div>
                    <div className="text-xs text-muted-foreground font-mono tabular-nums">
                      Live now · {activeLiveSession.attendeeCount ?? 0} check-ins
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user?.role === 'admin' && (
                    <Button
                      variant="outline"
                      onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                      disabled={isClosingSession}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Close Live QR</span>
                    </Button>
                  )}
                  {user?.role !== 'advisor' && (
                    <Button asChild>
                      <Link href="/scan">
                        <span>Mark Attendance</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* ── Main Content ───────────────────────────────────── */}
            {isLoading ? (
              <div className="space-y-4" aria-label="Loading dashboard">
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
                <Card className="p-5 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </Card>
              </div>
            ) : isPrivileged ? (
              /* ADMIN + ADVISOR READ-ONLY VIEW */
              <div className="space-y-4">
                <TeamAnalyticsCharts
                  teamAnalytics={adminAnalytics?.teamAnalytics || []}
                  summary={adminAnalytics?.summary || {
                    totalMembers: 0,
                    totalSessions: 0,
                    overallAttendanceRate: 0,
                    onTimeCount: 0,
                    lateCount: 0,
                  }}
                />

                {activeLiveSession && (
                  <Card className="p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h3 className="text-sm font-bold text-foreground">
                        Active session details
                      </h3>
                      {user?.role === 'admin' && (
                        <Button
                          variant="outline"
                          onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                          disabled={isClosingSession}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>End Session</span>
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Wing target', value: activeLiveSession.teamName },
                        { label: 'Location', value: activeLiveSession.location },
                        { label: 'Live check-ins', value: `${activeLiveSession.attendeeCount} members`, highlight: true },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-lg bg-secondary border border-border text-sm">
                          <span className="text-xs font-medium text-muted-foreground block mb-1">
                            {item.label}
                          </span>
                          <span className={cn(
                            'font-semibold block text-sm tabular-nums',
                            item.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                          )}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              /* MEMBER VIEW */
              <div className="space-y-4">
                {/* Quick actions & Notion Callout */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild id="dashboard-scan-cta" className="font-bold gap-2 focus-orange shadow-sm rounded-xl">
                      <Link href="/scan">
                        <QrCode className="w-4 h-4" />
                        <span>Scan Session QR</span>
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="font-semibold gap-2 rounded-xl">
                      <Link href="/my-attendance">
                        <ClipboardList className="w-4 h-4" />
                        <span>My Attendance</span>
                      </Link>
                    </Button>
                  </div>

                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DCC · Camu Attendance System</span>
                  </div>
                </div>

                {/* Notion-Style Student Club Callout */}
                <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-xl border border-border/80 bg-secondary/35 text-xs text-muted-foreground">
                  <span className="text-base shrink-0 select-none">💡</span>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      <strong className="text-foreground font-semibold">Campus Tip:</strong> Check in within 15 minutes of session start to maintain your 100% punctuality rating.
                    </span>
                    <Link href="/my-attendance" className="text-accent font-semibold hover:underline shrink-0 flex items-center gap-1">
                      <span>View history</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Stat strip with Gen-Z Notion feel */}
                <Card className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:divide-x sm:divide-border rounded-2xl">
                  <div className="flex-1 sm:pr-6">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <span>Attendance rate</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary font-mono">Goal: 85%+</span>
                    </div>
                    <div className="text-[22px] font-black tabular-nums text-foreground mt-0.5">
                      {animatedAttendance}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {userStats?.stats?.attendedCount || 0} of {userStats?.stats?.totalSessions || 0} sessions
                    </div>
                  </div>
                  <div className="flex-1 sm:px-6">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <span>Active streak</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                        🔥 On Fire
                      </span>
                    </div>
                    <div className="text-[22px] font-black tabular-nums text-foreground mt-0.5 flex items-center gap-1.5">
                      <Flame className="w-5 h-5 text-amber-500" />
                      {userStats?.stats?.currentStreak || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">consecutive check-ins</div>
                  </div>
                  <div className="flex-1 sm:pl-6">
                    <div className="text-xs text-muted-foreground font-medium">Club position</div>
                    <div className="text-[22px] font-black text-foreground mt-0.5 truncate">
                      {user?.position || 'Member'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 capitalize flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                      <span className="truncate">{user?.teamName || 'All Club Members'} · {user?.role}</span>
                    </div>
                  </div>
                </Card>

                {/* Notion Student Pass Row — QR opens in dialog */}
                <Card className="p-4 flex items-center gap-3.5 rounded-2xl hover:border-accent/40 transition-colors">
                  <div className="relative shrink-0">
                    <MemberAvatar
                      src={user?.avatarUrl}
                      name={user?.name}
                      className="h-12 w-12 rounded-xl border-2 border-border shrink-0 shadow-xs ring-2 ring-accent/15"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 border-2 border-card text-[8px] text-white font-bold">
                      ✓
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{user?.name}</span>
                      <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        CLUB ID
                      </span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground truncate mt-0.5" title={user?.email}>
                      {user?.rollNumber} · {user?.email}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)} className="rounded-xl font-bold gap-1.5 focus-orange">
                    <QrCode className="w-3.5 h-3.5 text-accent" />
                    <span>View Pass</span>
                  </Button>
                </Card>
                <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                  <DialogContent className="sm:max-w-sm">
                    <DialogTitle className="sr-only">Member QR code</DialogTitle>
                    <QRDisplayCard
                      bare
                      title={user?.name || 'Member Badge'}
                      qrCodeToken={user?.rollNumber || 'S24CSEU0771'}
                      subtitle={`${user?.position || 'Member'} · ${user?.email}`}
                      type="member"
                      avatarUrl={user?.avatarUrl}
                    />
                  </DialogContent>
                </Dialog>

                {/* ── Recent Check-ins ──────────────────────────── */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">Recent check-ins</h3>
                    <Link
                      href="/my-attendance"
                      className="text-[13px] text-accent font-semibold hover:underline underline-offset-4"
                    >
                      View all
                    </Link>
                  </div>

                  {userStats?.history?.length > 0 ? (
                    <div>
                      {userStats.history.map((log: any) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 text-sm"
                        >
                          <span className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            log.status === 'late' ? 'bg-amber-500' : 'bg-emerald-500'
                          )} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate">{log.sessionTitle}</div>
                            <div className="text-xs text-muted-foreground truncate">{log.location}</div>
                          </div>
                          <Badge
                            variant={log.status === 'late' ? 'warning' : 'success'}
                            className="capitalize shrink-0"
                          >
                            {log.status === 'late' ? 'Late' : 'Present'}
                          </Badge>
                          <div className="font-mono text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
                            {new Date(log.scannedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={QrCode}
                      title="No check-ins yet"
                      description="Scan a session QR code to record your first attendance."
                      action={
                        <Button asChild variant="secondary" size="sm">
                          <Link href="/scan">
                            <QrCode className="w-3.5 h-3.5" />
                            Scan now
                          </Link>
                        </Button>
                      }
                    />
                  )}
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
