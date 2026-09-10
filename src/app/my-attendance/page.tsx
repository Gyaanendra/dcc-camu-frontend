'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { PageLoader } from '@/components/layout/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-border shrink-0">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-secondary text-foreground text-lg font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Member Record
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  My Attendance & Streak History
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Individual check-in record for {user?.name}</p>
              </div>
            </Card>

            {isLoading ? (
              <PageLoader message="Loading your attendance & streak records..." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Stat Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Attendance Rate</span>
                      <div className="text-2xl font-semibold text-foreground mt-2 tabular-nums tracking-tight">
                        {myStats?.stats?.attendancePercentage || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {myStats?.stats?.attendedCount || 0} of {myStats?.stats?.totalSessions || 0} sessions
                      </div>
                    </Card>

                    <Card className="p-5">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Active Streak</span>
                      <div className="text-2xl font-semibold text-foreground mt-2 tabular-nums tracking-tight">
                        {myStats?.stats?.currentStreak || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">consecutive check-ins</div>
                    </Card>

                    <Card className="p-5">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Punctuality Score</span>
                      <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums tracking-tight">
                        {myStats?.stats?.punctualityPercentage || 100}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">On-time check-ins</div>
                    </Card>
                  </div>

                  {/* History Timeline */}
                  <Card className="p-6 space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Attendance History</h3>

                    <div className="space-y-2.5">
                      {myStats?.history?.length > 0 ? (
                        myStats.history.map((h: any) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-card border border-border text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{h.sessionTitle}</div>
                                <div className="text-[11px] text-muted-foreground">{h.location}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge
                                variant="secondary"
                                className={
                                  h.status === 'late'
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-mono text-[10px] font-bold uppercase tracking-wider'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-mono text-[10px] font-bold uppercase tracking-wider'
                                }
                              >
                                {h.status}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                {new Date(h.scannedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          No attendance records found for your account.
                        </div>
                      )}
                    </div>
                  </Card>
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
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
