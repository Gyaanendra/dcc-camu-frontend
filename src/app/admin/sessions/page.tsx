'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Calendar, MapPin, PowerOff, Play, RefreshCw, CalendarCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminSessionsPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'advisor';
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, teamsRes] = await Promise.all([api.getSessions(), api.getTeams()]);
      setSessions(sessionsRes.sessions || []);
      setTeams(teamsRes.teams || []);

      if (sessionsRes.sessions?.length > 0) {
        const currentId = selectedSession?.id || sessionsRes.sessions[0].id;
        const matching = sessionsRes.sessions.find((s: any) => s.id === currentId) || sessionsRes.sessions[0];
        setSelectedSession(matching);
        loadSessionDetail(matching.id);
      }
    } catch (error: any) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetail = async (id: string) => {
    try {
      const res = await api.getSession(id);
      setSessionDetail(res);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSession = (s: any) => {
    setSelectedSession(s);
    loadSessionDetail(s.id);
  };

  const handleToggleSessionStatus = async () => {
    if (!selectedSession) return;
    const isCurrentlyActive = selectedSession.isActive === 'true';
    const nextStatus = !isCurrentlyActive;

    setIsUpdatingStatus(true);
    try {
      const res = await api.updateSessionStatus(selectedSession.id, { isActive: nextStatus });
      toast.success(res.message || 'Session status updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Sessions' }]} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <PageHeader
              icon={CalendarCheck}
              crumbs={[{ label: 'Admin' }, { label: 'Sessions' }]}
              title="Sessions & live QR"
              description={isReadOnly ? 'View-only access — session controls are disabled for advisors' : 'Schedule sessions, project dynamic QR codes, and monitor live check-ins'}
              actions={
                <>
                  <CreateSessionModal teams={teams} onCreated={loadData} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadData}
                    title="Refresh Sessions"
                    className="focus-orange"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              }
            />

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[76px] rounded-lg" />
                  ))}
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-[72px] rounded-lg" />
                  <Skeleton className="h-64 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sessions List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                    <h2 className="text-xs font-medium text-muted-foreground">
                      Sessions
                    </h2>
                    <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                      {sessions.length} of {sessions.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {sessions.length > 0 ? (
                      sessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors focus-orange ${
                            selectedSession?.id === s.id
                              ? 'bg-accent/10 border-accent/40 text-foreground'
                              : 'bg-card border-border hover:bg-secondary/60 text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                              {s.type}
                            </Badge>
                            {s.isActive === 'true' ? (
                              <Badge variant="success" className="gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                                Live
                                <span className="font-mono tabular-nums">{s.attendeeCount}</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Ended</Badge>
                            )}
                          </div>

                          <div className="font-medium text-sm mt-2">{s.title}</div>
                          <div className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </div>

                          <div className="mt-3 pt-2 border-t border-border font-mono text-[13px] text-muted-foreground">
                            {s?.startTime ? new Date(s.startTime).toLocaleDateString() : 'N/A'}
                          </div>
                        </button>
                      ))
                    ) : (
                      <EmptyState
                        icon={CalendarCheck}
                        title="No sessions yet"
                        description='No sessions created yet. Click "Create New Session" above to get started.'
                      />
                    )}
                  </div>
                </div>

            {/* Selected Session QR Broadcast & Attendees Feed */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSession ? (
                <>
                  <Card className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 ${selectedSession.isActive === 'true' ? 'border-emerald-500/40 dark:border-emerald-500/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedSession.isActive === 'true' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-foreground">{selectedSession.title}</div>
                        <div className="text-xs text-muted-foreground">Status: <strong className={selectedSession.isActive === 'true' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{selectedSession.isActive === 'true' ? 'Active Live QR' : 'Session Ended / QR Closed'}</strong></div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleToggleSessionStatus}
                      disabled={isUpdatingStatus || isReadOnly}
                      style={isReadOnly ? { display: 'none' } : undefined}
                      className={
                        selectedSession.isActive === 'true'
                          ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive focus-orange'
                          : 'border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 focus-orange'
                      }
                    >
                      {selectedSession.isActive === 'true' ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>Close Live QR / End Session</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Re-activate Session QR</span>
                        </>
                      )}
                    </Button>
                  </Card>

                  <QRDisplayCard
                    title={selectedSession.title}
                    qrCodeToken={selectedSession.qrCodeToken}
                    subtitle={selectedSession.isActive === 'true' ? "Broadcast on Screen for Member Check-in" : "Session Closed (Attendance Disabled)"}
                    location={selectedSession.location}
                    status={selectedSession.isActive === 'true' ? 'live' : 'idle'}
                  />

                  {/* Real-time Attendees Feed */}
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h3 className="text-sm font-bold text-foreground">Real-time Attendance Feed</h3>
                      <Badge variant="success" className="tabular-nums">
                        <span className="font-mono">{sessionDetail?.attendeeCount || 0} checked in</span>
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {sessionDetail?.attendees?.length > 0 ? (
                        sessionDetail.attendees.map((a: any) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground text-sm">
                                {a.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{a.name}</div>
                                <div className="font-mono text-[13px] text-muted-foreground max-w-[180px] truncate" title={a.rollNumber}>{a.rollNumber}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge variant={a.status === 'late' ? 'warning' : 'success'}>
                                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                              </Badge>
                              <div className="font-mono text-[13px] text-muted-foreground mt-1">
                                {new Date(a.scannedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon={Users}
                          title="No check-ins yet"
                          description="No members have checked in for this session yet."
                        />
                      )}
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center text-muted-foreground text-sm">
                  Select a session to view QR code.
                </Card>
              )}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
