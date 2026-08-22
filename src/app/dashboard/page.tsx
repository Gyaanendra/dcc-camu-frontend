'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  QrCode,
  Award,
  Flame,
  Calendar,
  RefreshCw,
  ArrowRight,
  Edit2,
  Check,
  TrendingUp,
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

  // Position edit state
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Editorial Greeting Bar */}
          <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                <span>Bennett University</span>
                <span>•</span>
                <span>Club DCC Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Welcome back, {user?.name || 'Member'}
              </h1>
              
              {/* Position and Wing Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 dark:text-zinc-400">
                <span className="text-slate-400 dark:text-zinc-500">Position:</span>
                {isEditingPosition ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={positionInput}
                      onChange={(e) => setPositionInput(e.target.value)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-blue-500 dark:border-blue-500 text-slate-900 dark:text-zinc-100 text-xs outline-none shadow-sm font-medium"
                    />
                    <button
                      onClick={handleSavePosition}
                      className="p-1 rounded-md bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800"
                      title="Save Position"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPosition(true)}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-medium hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition-colors"
                    title="Click to edit position"
                  >
                    <span>{user?.position || 'Member'}</span>
                    <Edit2 className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                  </button>
                )}

                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="text-slate-400 dark:text-zinc-500">Wing:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">{user?.teamName || 'All Club Members'}</span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="text-slate-400 dark:text-zinc-500">Role:</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 font-semibold text-[10px] uppercase tracking-wider">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/scan"
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Instant QR Scan</span>
              </Link>
              <button
                onClick={loadDashboardData}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Live Session Alert Banner */}
          {activeLiveSession && (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Active Session Now</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{activeLiveSession.title}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                    disabled={isClosingSession}
                    className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="End Session and close QR"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Close Live QR</span>
                  </button>
                )}
                <Link
                  href="/scan"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Mark Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Main Dashboard Layout */}
          {user?.role === 'admin' ? (
            /* ADMIN EXECUTIVE VIEW */
            <div className="space-y-6">
              {adminAnalytics ? (
                <TeamAnalyticsCharts
                  teamAnalytics={adminAnalytics.teamAnalytics || []}
                  summary={adminAnalytics.summary || { totalMembers: 0, totalSessions: 0, overallAttendanceRate: 0, onTimeCount: 0, lateCount: 0 }}
                />
              ) : (
                <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-mono text-xs dash-card bg-white dark:bg-zinc-900">
                  Loading database records...
                </div>
              )}

              {/* Active Session Live Broadcast Box for Admins */}
              {activeLiveSession && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <QRDisplayCard
                      title={activeLiveSession.title}
                      qrCodeToken={activeLiveSession.qrCodeToken}
                      subtitle="Broadcast on Screen for Member Check-in"
                      location={activeLiveSession.location}
                    />
                  </div>

                  <div className="lg:col-span-2 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Active Session Details
                      </h3>
                      <button
                        onClick={() => handleCloseActiveSession(activeLiveSession.id)}
                        disabled={isClosingSession}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>End Session</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700">
                        <span className="text-slate-400 dark:text-zinc-400 block text-[10px] uppercase font-bold">Wing Target</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 mt-1 block">{activeLiveSession.teamName}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700">
                        <span className="text-slate-400 dark:text-zinc-400 block text-[10px] uppercase font-bold">Location</span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100 mt-1 block">{activeLiveSession.location}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700">
                        <span className="text-slate-400 dark:text-zinc-400 block text-[10px] uppercase font-bold">Live Check-ins</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block text-sm">
                          {activeLiveSession.attendeeCount} members
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MEMBER VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* 3 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90">
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <span>Attendance Rate</span>
                      <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
                      {userStats?.stats?.attendancePercentage || 0}%
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      {userStats?.stats?.attendedCount || 0} of {userStats?.stats?.totalSessions || 0} sessions
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90">
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <span>Active Streak</span>
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
                      {userStats?.stats?.currentStreak || 0}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">consecutive check-ins</div>
                  </div>

                  <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90">
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <span>Club Position</span>
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-2 truncate">
                      {user?.position || 'Member'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Assigned role: {user?.role}</div>
                  </div>
                </div>

                {/* Personal History Activity Feed */}
                <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Recent Attendance History</h3>
                    <Link href="/my-attendance" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {userStats?.history?.length > 0 ? (
                      userStats.history.map((log: any) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-zinc-100">{log.sessionTitle}</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{log.location}</div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                log.status === 'late'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              {log.status}
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                              {new Date(log.scannedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
                        No attendance records logged yet. Scan a session QR code to record attendance.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Member QR ID Badge */}
              <div className="lg:col-span-1">
                <QRDisplayCard
                  title={user?.name || 'Member Badge'}
                  qrCodeToken={user?.rollNumber || 'S24CSEU0771'}
                  subtitle={`${user?.position || 'Member'} • ${user?.email}`}
                  type="member"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
