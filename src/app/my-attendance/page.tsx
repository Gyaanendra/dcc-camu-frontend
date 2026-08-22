'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Award, Flame, CalendarCheck, CheckCircle2 } from 'lucide-react';

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [myStats, setMyStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getMyStats().then((res) => {
        setMyStats(res);
        setIsLoading(false);
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Member Record
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" /> My Attendance & Streak History
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Individual check-in record for {user?.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Attendance Rate</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
                    {myStats?.stats?.attendancePercentage || 0}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    {myStats?.stats?.attendedCount || 0} of {myStats?.stats?.totalSessions || 0} sessions
                  </div>
                </div>

                <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Active Streak</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-2">
                    {myStats?.stats?.currentStreak || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">consecutive check-ins</div>
                </div>

                <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Punctuality Score</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">100%</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">On-time check-ins</div>
                </div>
              </div>

              {/* History Timeline */}
              <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Attendance History
                </h3>

                <div className="space-y-2.5">
                  {myStats?.history?.length > 0 ? (
                    myStats.history.map((h: any) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-zinc-100">{h.sessionTitle}</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">{h.location}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              h.status === 'late'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            }`}
                          >
                            {h.status}
                          </span>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                            {new Date(h.scannedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
                      No attendance records found for your account.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <QRDisplayCard
                title={user?.name || 'Member Badge'}
                qrCodeToken={user?.rollNumber || 'S24CSEU0771'}
                subtitle={`${user?.position || 'Member'} • ${user?.email}`}
                type="member"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
