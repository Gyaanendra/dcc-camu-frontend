'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { PageLoader } from '@/components/layout/PageLoader';
import { cn } from '@/lib/utils';
import {
  QrCode,
  Award,
  Flame,
  Calendar,
  RefreshCw,
  ArrowRight,
  Edit2,
  Check,
  Users,
  Radio,
  PowerOff,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, updateUserPosition } = useAuth();
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingSession, setIsClosingSession] = useState(false);

  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [positionInput, setPositionInput] = useState('');

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'admin') {
        const data = await api.getAdminAnalytics();
        setAdminAnalytics(data);
      } else {
        const data = await api.getMyStats();
        setUserStats(data);
      }
      const sessionsRes = await api.getSessions();
      setActiveSessions(sessionsRes.sessions || []);
    } catch (error) {
      console.warn('Dashboard load warning:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setPositionInput(user.position || 'Member');
    }
  }, [user]);

  const handleSavePosition = async () => {
    if (!positionInput.trim()) return;
    await updateUserPosition(positionInput.trim());
    setIsEditingPosition(false);
  };

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-6 max-w-7xl mx-auto w-full space-y-4">

            {/* ── Greeting Header ───────────────────────────────── */}
            <div className="dash-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 anim-fade-up">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  <span>Bennett University</span>
                  <span className="text-border">·</span>
                  <span>Club DCC Portal</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Member'}
                </h1>

                {/* Position + Wing + Role pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                  <span className="text-muted-foreground">Position:</span>

                  {isEditingPosition ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={positionInput}
                        onChange={e => setPositionInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSavePosition()}
                        className="px-2 py-0.5 rounded-md bg-transparent border border-ring text-foreground text-xs outline-none font-medium w-32"
                        autoFocus
                      />
                      <button
                        onClick={handleSavePosition}
                        id="save-position-btn"
                        className="p-1 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                        title="Save Position"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingPosition(true)}
                      id="edit-position-btn"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground font-medium hover:bg-muted transition-colors text-xs"
                      title="Click to edit position"
                    >
                      <span>{user?.position || 'Member'}</span>
                      <Edit2 className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  )}

                  <span className="text-border">·</span>
                  <span className="text-muted-foreground">Wing:</span>
                  <span className="font-medium text-foreground">{user?.teamName || 'All Club Members'}</span>
                  <span className="text-border">·</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] uppercase tracking-wider">
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/scan"
                  id="dashboard-scan-cta"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs shadow-sm transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Instant QR Scan</span>
                </Link>
                <button
                  onClick={loadDashboardData}
                  id="dashboard-refresh"
                  className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </button>
              </div>
            </div>

            {/* ── Active Session Banner ──────────────────────────── */}
            {activeLiveSession && (
              <div className="dash-card p-4 border-emerald-500/30 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 anim-fade-up anim-delay-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Active Session Now
                    </div>
                    <div className="text-sm font-semibold text-foreground">{activeLiveSession.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                      disabled={isClosingSession}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Close Live QR</span>
                    </button>
                  )}
                  <Link
                    href="/scan"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <span>Mark Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* ── Main Content ───────────────────────────────────── */}
            {isLoading ? (
              <PageLoader message="Loading dashboard analytics..." />
            ) : user?.role === 'admin' ? (
              /* ADMIN VIEW */
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                      <QRDisplayCard
                        title={activeLiveSession.title}
                        qrCodeToken={activeLiveSession.qrCodeToken}
                        subtitle="Broadcast on Screen for Member Check-in"
                        location={activeLiveSession.location}
                      />
                    </div>

                    <div className="lg:col-span-2 dash-card p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          Active Session Details
                        </h3>
                        <button
                          onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                          disabled={isClosingSession}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>End Session</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Wing Target', value: activeLiveSession.teamName },
                          { label: 'Location', value: activeLiveSession.location },
                          { label: 'Live Check-ins', value: `${activeLiveSession.attendeeCount} members`, highlight: true },
                        ].map(item => (
                          <div key={item.label} className="p-3 rounded-xl bg-secondary border border-border text-xs">
                            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block mb-1">
                              {item.label}
                            </span>
                            <span className={cn(
                              'font-semibold block text-sm',
                              item.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                            )}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MEMBER VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">

                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Attendance Rate */}
                    <div className="dash-card p-5 anim-fade-up anim-delay-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Attendance Rate
                        </span>
                        <Award className="w-4 h-4 text-accent" />
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-2 tabular-nums tracking-tight">
                        {userStats?.stats?.attendancePercentage || 0}%
                      </div>
                      <div className="mt-2 w-full h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-accent anim-progress"
                          style={{ width: `${userStats?.stats?.attendancePercentage || 0}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5">
                        {userStats?.stats?.attendedCount || 0} of {userStats?.stats?.totalSessions || 0} sessions
                      </div>
                    </div>

                    {/* Active Streak */}
                    <div className="dash-card p-5 anim-fade-up anim-delay-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Active Streak
                        </span>
                        <Flame className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-2 tabular-nums tracking-tight">
                        {userStats?.stats?.currentStreak || 0}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5">
                        consecutive check-ins
                      </div>
                    </div>

                    {/* Club Position */}
                    <div className="dash-card p-5 anim-fade-up anim-delay-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                          Club Position
                        </span>
                        <Users className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-base font-bold text-foreground mt-2 truncate">
                        {user?.position || 'Member'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5">
                        Role: <span className="text-accent font-semibold capitalize">{user?.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Recent Attendance History ───────────────── */}
                  <div className="dash-card p-5 space-y-4 anim-fade-up anim-delay-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">Recent Attendance History</h3>
                      <Link
                        href="/my-attendance"
                        className="text-xs text-accent font-semibold hover:underline underline-offset-4"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="space-y-2">
                      {isLoading ? (
                        [1, 2, 3].map(i => (
                          <div key={i} className="skeleton h-14" />
                        ))
                      ) : userStats?.history?.length > 0 ? (
                        userStats.history.map((log: any) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground truncate">{log.sessionTitle}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.location}</div>
                            </div>
                            <div className="text-right ml-3 shrink-0">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                log.status === 'late'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              )}>
                                {log.status}
                              </span>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {new Date(log.scannedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <QrCode className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">No records yet</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Scan a session QR code to record attendance</p>
                          <Link
                            href="/scan"
                            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold transition-all shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Scan Now
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Member QR ID Badge ──────────────────────── */}
                <div className="lg:col-span-1 anim-fade-up anim-delay-2">
                  <QRDisplayCard
                    title={user?.name || 'Member Badge'}
                    qrCodeToken={user?.rollNumber || 'S24CSEU0771'}
                    subtitle={`${user?.position || 'Member'} · ${user?.email}`}
                    type="member"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
