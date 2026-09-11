'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { History, CalendarX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [myStats, setMyStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late'>('all');

  useEffect(() => {
    if (user) {
      api.getMyStats().then((res) => {
        setMyStats(res);
        setIsLoading(false);
      });
    }
  }, [user]);

  const filtered = useMemo(() => {
    const history: any[] = myStats?.history || [];
    if (statusFilter === 'all') return history;
    return history.filter((h) =>
      statusFilter === 'late' ? h.status === 'late' : h.status !== 'late'
    );
  }, [myStats, statusFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const h of filtered) {
      const key = new Date(h.scannedAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return Array.from(map.entries()).sort((a, b) => +new Date(b[0]) - +new Date(a[0]));
  }, [filtered]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
            <PageHeader
              icon={History}
              title="My attendance"
              description={`Check-in record for ${user?.name || 'member'}`}
            />

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" aria-label="Loading attendance">
                <div className="lg:col-span-2 space-y-4">
                  <Card className="px-5 py-4 flex gap-6">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                  </Card>
                  <Card className="p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </Card>
                </div>
                <Skeleton className="h-72" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {/* Streak summary head */}
                  <Card className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:divide-x sm:divide-border">
                    <div className="flex-1 sm:pr-6">
                      <div className="text-xs text-muted-foreground">Attendance rate</div>
                      <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
                        {myStats?.stats?.attendancePercentage || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {myStats?.stats?.attendedCount || 0} of {myStats?.stats?.totalSessions || 0} sessions
                      </div>
                    </div>
                    <div className="flex-1 sm:px-6">
                      <div className="text-xs text-muted-foreground">Active streak</div>
                      <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
                        {myStats?.stats?.currentStreak || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">consecutive check-ins</div>
                    </div>
                    <div className="flex-1 sm:pl-6">
                      <div className="text-xs text-muted-foreground">Punctuality</div>
                      <div className="text-[20px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                        {myStats?.stats?.punctualityPercentage || 100}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">on-time check-ins</div>
                    </div>
                  </Card>

                  {/* Timeline */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-foreground">History</h3>
                      <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                          <SelectTrigger className="h-8 w-[128px] text-[13px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {filtered.length} of {myStats?.history?.length || 0}
                        </span>
                      </div>
                    </div>

                    {groups.length > 0 ? (
                      <div className="space-y-4">
                        {groups.map(([date, items]) => (
                          <div key={date}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">{date}</div>
                            <div>
                              {items.map((h: any) => {
                                const absolute = new Date(h.scannedAt).toLocaleString();
                                return (
                                  <div
                                    key={h.id}
                                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 text-sm"
                                  >
                                    <span className={cn(
                                      'h-2 w-2 rounded-full shrink-0',
                                      h.status === 'late' ? 'bg-amber-500' : 'bg-emerald-500'
                                    )} />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-foreground truncate">{h.sessionTitle}</div>
                                      <div className="text-xs text-muted-foreground truncate">{h.location}</div>
                                    </div>
                                    <Badge
                                      variant={h.status === 'late' ? 'warning' : 'success'}
                                      className="capitalize shrink-0"
                                    >
                                      {h.status === 'late' ? 'Late' : 'Present'}
                                    </Badge>
                                    <div className="text-right shrink-0 hidden sm:block">
                                      <div className="text-xs text-muted-foreground" title={absolute}>
                                        {timeAgo(h.scannedAt)}
                                      </div>
                                      <div className="font-mono text-xs text-muted-foreground tabular-nums">
                                        {new Date(h.scannedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={CalendarX2}
                        title={statusFilter === 'all' ? 'No attendance records yet' : `No ${statusFilter} check-ins`}
                        description={statusFilter === 'all'
                          ? 'Scan a session QR code to record your first attendance.'
                          : 'Try a different status filter.'}
                        action={statusFilter !== 'all' ? (
                          <button
                            onClick={() => setStatusFilter('all')}
                            className="text-[13px] font-semibold text-accent hover:underline underline-offset-4"
                          >
                            Reset filters
                          </button>
                        ) : undefined}
                      />
                    )}
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <QRDisplayCard
                    title={user?.name || 'Member Badge'}
                    qrCodeToken={user?.rollNumber || 'S24CSEU0771'}
                    subtitle={`${user?.position || 'Member'} • ${user?.email}`}
                    type="member"
                    avatarUrl={user?.avatarUrl}
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
