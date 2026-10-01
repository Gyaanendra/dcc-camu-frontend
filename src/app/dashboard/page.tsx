'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QrCode,
  RefreshCw,
  ArrowRight,
  Radio,
  PowerOff,
  Flame,
  CreditCard,
  FileText,
  CalendarX2,
  Clock,
  MapPin,
  Check,
  Zap,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function useCountUp(target: number, ms = 700) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function getAcademicYear(rollNumber?: string | null): string {
  if (!rollNumber) return 'Other';
  const clean = rollNumber.trim().toLowerCase();
  const match = clean.match(/^[a-z]*(\d{2})/i);
  if (!match) return 'Other';
  switch (match[1]) {
    case '26': return '1st Year';
    case '25': return '2nd Year';
    case '24': return '3rd Year';
    case '23': return '4th Year';
    default: return 'Other';
  }
}

function isSessionApplicableToUser(session: any, user: any, hasAttended: boolean = false): boolean {
  if (!session || !user) return false;
  if (user.role === 'advisor') return false;
  if (hasAttended) return true;

  // 1. Check if meeting took place before member joined DCC CAMU
  if (session.startTime && user.createdAt) {
    const sessionTime = new Date(session.startTime).getTime();
    const userJoinedTime = new Date(user.createdAt).getTime();
    if (sessionTime < userJoinedTime - 60 * 1000) {
      return false; // User had not joined yet
    }
  }

  // 2. Academic year targeting
  const targetYears: string[] = Array.isArray(session.targetYears)
    ? session.targetYears
    : typeof session.targetYears === 'string' && session.targetYears.trim()
    ? (() => {
        try {
          return JSON.parse(session.targetYears);
        } catch {
          return session.targetYears.split(',').map((s: string) => s.trim());
        }
      })()
    : [];

  if (targetYears.length > 0) {
    const userYear = getAcademicYear(user.rollNumber);
    if (!targetYears.includes(userYear)) {
      return false;
    }
  }

  // 3. Heads-only meetings check
  if (session.targetAudience === 'heads_only') {
    const pos = (user.position || '').trim().toLowerCase();
    if (
      pos === 'senior executive' ||
      pos === 'junior executive' ||
      pos === 'executive' ||
      pos === 'member' ||
      pos === 'advisor'
    ) {
      return false;
    }
    const isHead = /\b(head|sub[\s-]?head|lead|co[\s-]?lead|president|vp|vice[\s-]?president|secretary|treasurer|coordinator|convener|convenor|director)\b/i.test(pos);
    if (!isHead && user.role !== 'admin') {
      return false;
    }
  }

  // 4. Teams-only meetings check
  if (session.targetAudience === 'teams_only' || (session.teamId && !session.targetAudience)) {
    const targetTeams = Array.isArray(session.targetTeamIds)
      ? session.targetTeamIds
      : (session.teamId ? [session.teamId] : []);
    if (targetTeams.length > 0) {
      if (!user.teamId || !targetTeams.includes(user.teamId)) {
        return false;
      }
    }
  }
  return true;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [data, sessionsRes] = await Promise.all([
        api.getMyStats(),
        api.getSessions().catch(() => ({ sessions: [] })),
      ]);
      setUserStats(data);
      setActiveSessions(sessionsRes.sessions || []);
    } catch (error) {
      // Graceful fallback for empty states
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleCloseActiveSession = async (sessionId: string) => {
    setIsClosingSession(true);
    try {
      await api.updateSessionStatus(sessionId, { isActive: false });
      toast.success('Live Session QR closed and attendance ended.');
      await loadUserData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close session');
    } finally {
      setIsClosingSession(false);
    }
  };

  const activeLiveSession = activeSessions.find(
    (s) => s.isActive === 'true' && isSessionApplicableToUser(s, user, false)
  );

  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Member';
  const animatedAttendance = useCountUp(userStats?.stats?.attendancePercentage || 0);
  const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Synthesize complete history: verified attended sessions + only real unexcused absent sessions
  const fullAttendanceHistory = useMemo(() => {
    const historyList = [...(userStats?.history || [])];

    // Build sets of all attended titles & ids to guarantee zero false absent duplicates
    const attendedTitles = new Set(
      historyList
        .filter((h: any) => h.status === 'present' || h.status === 'late')
        .map((h: any) => (h.sessionTitle || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const attendedIds = new Set(
      historyList
        .filter((h: any) => h.status === 'present' || h.status === 'late' || h.sessionId)
        .map((h: any) => h.sessionId || h.id)
        .filter(Boolean)
    );

    const isAttended = (session: any) => {
      if (session.id && attendedIds.has(session.id)) return true;
      const title = (session.title || '').trim().toLowerCase();
      if (title && attendedTitles.has(title)) return true;
      return false;
    };

    // Official absent count from backend stats
    const officialAbsentCount =
      userStats?.stats?.absentCount ??
      Math.max(0, (userStats?.stats?.totalSessions || 0) - (userStats?.stats?.attendedCount || 0));

    // If official absent count is 0, user has missed 0 eligible meetings
    const now = new Date();
    const missedSessions: any[] = [];

    if (officialAbsentCount > 0) {
      for (const session of activeSessions) {
        const isPastOrClosed = session.isActive !== 'true' || (session.startTime && new Date(session.startTime) < now);
        if (isPastOrClosed && isSessionApplicableToUser(session, user, false)) {
          if (!isAttended(session)) {
            missedSessions.push({
              id: `absent-${session.id}`,
              sessionId: session.id,
              sessionTitle: session.title,
              location: session.location || 'DCC Hub',
              scannedAt: session.startTime || session.createdAt || new Date().toISOString(),
              status: 'absent',
            });
            if (missedSessions.length >= officialAbsentCount) break;
          }
        }
      }
    }

    // Combine attended logs + verified missed sessions
    const combined = [...historyList, ...missedSessions];

    // Sort newest to oldest
    return combined.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }, [userStats, activeSessions, user]);

  // Filtered personal check-in history
  const filteredHistory = useMemo(() => {
    if (statusFilter === 'all') return fullAttendanceHistory;
    return fullAttendanceHistory.filter((h) => h.status === statusFilter);
  }, [fullAttendanceHistory, statusFilter]);

  // Grouped by formatted date
  const groupedHistory = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const h of filteredHistory) {
      const d = new Date(h.scannedAt);
      const key = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return Array.from(map.entries());
  }, [filteredHistory]);

  const isExempt = userStats?.stats?.isExempt || user?.role === 'advisor';
  const absentCount = userStats?.stats?.absentCount ?? Math.max(0, (userStats?.stats?.totalSessions || 0) - (userStats?.stats?.attendedCount || 0));

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Member' }, { label: 'Dashboard' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">

            {/* ── Top Personalized Greeting Header ────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

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
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    {/* Club Tag Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[11px] font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">
                        <Zap className="w-3 h-3 text-accent fill-accent/30" />
                        <span>Club DCC</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
                        Bennett Univ
                      </span>
                      {activeLiveSession && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Session Live</span>
                        </span>
                      )}
                    </div>

                    <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight truncate">
                      {daypart}, {firstName}!
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
                    size="sm"
                    onClick={() => setQrOpen(true)}
                    className="h-9 gap-1.5 text-xs font-semibold rounded-xl"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>My Pass</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadUserData}
                    id="dashboard-refresh"
                    title="Refresh Data"
                    className="rounded-xl h-9 w-9 bg-card/80 border-border/80 focus-orange"
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Active Session Alert Banner (If Live) ───────────── */}
            {activeLiveSession && (
              <Card className="p-4 border-emerald-500/40 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Radio className="w-4 h-4 motion-safe:animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-foreground truncate">{activeLiveSession.title}</div>
                    <div className="text-xs text-muted-foreground font-mono tabular-nums">
                      Live now · {activeLiveSession.attendeeCount ?? 0} members checked in
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user?.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                      disabled={isClosingSession}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                    >
                      <PowerOff className="w-3.5 h-3.5 mr-1" />
                      <span>Close Live QR</span>
                    </Button>
                  )}
                  {user?.role !== 'advisor' && (
                    <Button asChild size="sm">
                      <Link href="/scan">
                        <span>Mark Attendance</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* ── Quick Action Ribbon ─────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/scan"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all duration-150 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Scan Live QR</div>
                  <div className="text-[11px] text-muted-foreground truncate">Mark attendance</div>
                </div>
              </Link>

              <Link
                href="/od-requests"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-secondary/60 hover:border-border/80 transition-all duration-150 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">OD Requests</div>
                  <div className="text-[11px] text-muted-foreground truncate">CAMU sanctions</div>
                </div>
              </Link>

              <div
                onClick={() => setQrOpen(true)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-secondary/60 hover:border-border/80 transition-all duration-150 cursor-pointer group col-span-2 sm:col-span-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Digital Member Pass</div>
                  <div className="text-[11px] text-muted-foreground truncate">View QR badge</div>
                </div>
              </div>
            </div>

            {/* ── Main Content: Bento Grid ────────────────────────── */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-label="Loading dashboard">
                <div className="lg:col-span-4 space-y-4">
                  <Skeleton className="h-48 rounded-2xl" />
                  <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                  </div>
                  <Skeleton className="h-64 rounded-xl" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Left 4 Cols: Digital Member Pass Widget & Benchmark */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Digital Member Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#191919] via-[#242424] to-[#121212] p-5 text-white shadow-md border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src="/dcc-white.png"
                          alt="Club DCC"
                          className="h-5 w-auto object-contain"
                        />
                        <span className="font-mono text-xs text-white/70 tracking-wider">
                          DCC · PASS
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold">
                        Active
                      </Badge>
                    </div>

                    <div className="my-5">
                      <div className="font-mono text-base tracking-widest text-white/90">
                        {user?.rollNumber || 'S24CSEU0771'}
                      </div>
                      <div className="text-xs text-white/60 font-mono mt-0.5 truncate">
                        {user?.email || 'member@bennett.edu.in'}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-white/10">
                      <div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                          Member
                        </div>
                        <div className="text-sm font-bold text-white truncate max-w-[150px]">
                          {user?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                          Wing
                        </div>
                        <div className="text-xs font-semibold text-white/90">
                          {user?.teamName || 'Member'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setQrOpen(true)}
                        className="flex-1 bg-white text-black hover:bg-white/90 font-bold text-xs h-8 rounded-lg"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" /> View Pass
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="flex-1 bg-primary text-white hover:bg-primary-active font-bold text-xs h-8 rounded-lg"
                      >
                        <Link href="/scan">Scan QR</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Attendance Goal Progress Card */}
                  <Card className="p-4 border-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Attendance Benchmark</span>
                      <span className="font-mono text-xs font-bold text-primary tabular-nums">
                        {isExempt ? 'Exempt' : `${animatedAttendance}% / 85%`}
                      </span>
                    </div>

                    {/* Progress Bar 6px */}
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(5, isExempt ? 100 : animatedAttendance))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{userStats?.stats?.attendedCount || 0} Attended · {absentCount} Absent</span>
                      <span className={cn(
                        'font-semibold inline-flex items-center gap-1',
                        animatedAttendance >= 85 || isExempt ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      )}>
                        {isExempt ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Exempt Role</span>
                          </>
                        ) : animatedAttendance >= 85 ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>On Target</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Below 85%</span>
                          </>
                        )}
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Right 8 Cols: User KPI Cards + Attendance History Log */}
                <div className="lg:col-span-8 space-y-5">
                  {/* User KPIs Grid: exactly 1 Solid Orange Highlight Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Highlight Card: Attendance Rate with Progress Bar */}
                    <div className="card-highlight p-4 flex flex-col justify-between rounded-xl shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                          {isExempt ? 'Attendance Status' : 'Attendance Rate'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold">
                          Goal 85%
                        </span>
                      </div>
                      <div className="my-2">
                        {isExempt ? (
                          <div className="text-2xl font-black text-white">Exempt</div>
                        ) : (
                          <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                            {animatedAttendance}%
                          </div>
                        )}
                      </div>
                      {/* Mini progress bar on highlight card */}
                      <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden mb-2">
                        <div
                          className="bg-white h-full rounded-full"
                          style={{ width: `${Math.min(100, isExempt ? 100 : animatedAttendance)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-white/85 font-mono truncate">
                        {userStats?.stats?.attendedCount || 0} of {userStats?.stats?.totalSessions || 0} eligible sessions
                      </div>
                    </div>

                    {/* Card 2: Active Streak */}
                    <Card className="p-4 flex flex-col justify-between border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Active Streak
                        </span>
                        <span className="badge-delta-up">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
                          <span>Active</span>
                        </span>
                      </div>
                      <div className="my-2">
                        <div className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                          {userStats?.stats?.currentStreak || 0}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1.5 border-t border-border flex items-center justify-between">
                        <span>Check-ins streak</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Consistent</span>
                      </div>
                    </Card>

                    {/* Card 3: Punctuality */}
                    <Card className="p-4 flex flex-col justify-between border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Punctuality
                        </span>
                        <span className="badge-delta-up">
                          <span>{userStats?.stats?.punctualityPercentage ?? 100}%</span>
                        </span>
                      </div>
                      <div className="my-2">
                        <div className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                          {userStats?.stats?.punctualityPercentage ?? 100}%
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1.5 border-t border-border flex items-center justify-between">
                        <span>On-time arrivals</span>
                        <span className="text-[11px] font-mono text-muted-foreground">Club standard</span>
                      </div>
                    </Card>
                  </div>

                  {/* ── Personal Attendance History & Check-in Log ───── */}
                  <Card className="p-5 border-border rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div>
                        <h2 className="text-base font-bold text-foreground">Attendance History</h2>
                        <p className="text-xs text-muted-foreground">Verified check-in timestamps, present &amp; absent logs</p>
                      </div>

                      {/* Filter by status */}
                      <div className="flex items-center gap-2">
                        <Select
                          value={statusFilter}
                          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {filteredHistory.length} of {fullAttendanceHistory.length}
                        </span>
                      </div>
                    </div>

                    {filteredHistory.length === 0 ? (
                      <EmptyState
                        icon={CalendarX2}
                        title={statusFilter === 'all' ? 'No attendance records yet' : `No ${statusFilter} records found`}
                        description={
                          statusFilter === 'all'
                            ? 'Check into your first club session by scanning the organizer QR code or presenting your pass.'
                            : `No sessions found with status "${statusFilter}". Try selecting "All statuses".`
                        }
                        action={
                          statusFilter === 'all' ? (
                            <Button asChild size="sm">
                              <Link href="/scan">
                                <QrCode className="w-3.5 h-3.5 mr-1" />
                                <span>Scan Live QR</span>
                              </Link>
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <div className="max-h-[460px] overflow-y-auto custom-scroll pr-1.5 space-y-4">
                        {groupedHistory.map(([dateLabel, records]) => (
                          <div key={dateLabel} className="space-y-2">
                            {/* Date Group Header */}
                            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md">
                              {dateLabel}
                            </div>

                            {/* Records for this date */}
                            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                              {records.map((record: any) => {
                                const isPresent = record.status === 'present';
                                const isLate = record.status === 'late';
                                const isAbsent = record.status === 'absent';
                                const recordDate = new Date(record.scannedAt);
                                const checkInTime = recordDate.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });

                                return (
                                  <div
                                    key={record.id || `${record.sessionId}-${record.scannedAt}`}
                                    className="flex items-center justify-between p-3.5 bg-card hover:bg-secondary/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span
                                        className={cn(
                                          'h-2.5 w-2.5 rounded-full shrink-0',
                                          isPresent
                                            ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                            : isLate
                                            ? 'bg-amber-500 ring-2 ring-amber-500/20'
                                            : 'bg-rose-500 ring-2 ring-rose-500/20'
                                        )}
                                      />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-sm text-foreground truncate">
                                          {record.sessionTitle || 'DCC General Meeting'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                                          {record.location && (
                                            <span className="flex items-center gap-1 truncate">
                                              <MapPin className="w-3 h-3 text-muted-foreground" />
                                              {record.location}
                                            </span>
                                          )}
                                          <span>·</span>
                                          {isAbsent ? (
                                            <span className="flex items-center gap-1 text-rose-500 font-medium">
                                              <XCircle className="w-3 h-3" />
                                              <span>Missed session ({timeAgo(record.scannedAt)})</span>
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-muted-foreground" />
                                              <span>{checkInTime} ({timeAgo(record.scannedAt)})</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      {isPresent && (
                                        <Badge
                                          variant="success"
                                          className="capitalize text-[11px] font-semibold gap-1"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Present</span>
                                        </Badge>
                                      )}
                                      {isLate && (
                                        <Badge
                                          variant="warning"
                                          className="capitalize text-[11px] font-semibold gap-1"
                                        >
                                          <Clock className="w-3 h-3" />
                                          <span>Late</span>
                                        </Badge>
                                      )}
                                      {isAbsent && (
                                        <Badge
                                          variant="destructive"
                                          className="capitalize text-[11px] font-semibold gap-1"
                                        >
                                          <XCircle className="w-3 h-3" />
                                          <span>Absent</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Digital Member Pass QR Modal ────────────────────────── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogTitle className="sr-only">Digital Member Pass QR Code</DialogTitle>
          <QRDisplayCard
            type="member"
            title={user?.name || 'Club Member'}
            subtitle={user?.rollNumber || 'DCC Member'}
            location={user?.teamName || user?.position || 'Club Member'}
            qrCodeToken={user?.rollNumber || user?.id || ''}
            avatarUrl={user?.avatarUrl}
            bare
          />
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
