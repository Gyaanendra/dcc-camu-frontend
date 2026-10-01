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
import { Calendar, MapPin, PowerOff, Play, RefreshCw, CalendarCheck, Users, Crown, GraduationCap } from 'lucide-react';
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

  const [sessionSearch, setSessionSearch] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const loadData = async (focusSessionId?: string) => {
    setIsLoading(true);
    try {
      const [sessionsRes, teamsRes] = await Promise.all([api.getSessions(), api.getTeams()]);
      const loaded = sessionsRes.sessions || [];
      setSessions(loaded);
      setTeams(teamsRes.teams || []);

      if (loaded.length > 0) {
        const targetId = focusSessionId || selectedSession?.id || loaded[0].id;
        const matching = loaded.find((s: any) => s.id === targetId) || loaded[0];
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
    setAttendeeSearch('');
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

  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearch.trim()) return true;
    const q = sessionSearch.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.type?.toLowerCase().includes(q) ||
      s.audienceLabel?.toLowerCase().includes(q)
    );
  });

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Sessions' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full max-w-[99%] mx-auto space-y-6">
            <PageHeader
              icon={CalendarCheck}
              crumbs={[{ label: 'Admin' }, { label: 'Sessions' }]}
              title="Sessions & live QR"
              description={isReadOnly ? 'View-only access — session controls are disabled for advisors' : 'Schedule sessions, project dynamic QR codes, and monitor live check-ins'}
              actions={
                <>
                  <CreateSessionModal teams={teams} onCreated={(s?: any) => loadData(s?.id)} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => loadData()}
                    title="Refresh Sessions"
                    className="focus-orange h-10 w-10 rounded-xl"
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] min-h-[520px]">
                {/* Sessions List Column with Independent Scroll */}
                <div className="flex flex-col h-full min-h-0 bg-card rounded-xl border border-border p-3.5 shadow-xs">
                  <div className="space-y-2 pb-3 border-b border-border shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Sessions
                      </h2>
                      <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                        {filteredSessions.length} of {sessions.length}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-secondary/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-1.5 pt-3">
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors focus-orange ${
                            selectedSession?.id === s.id
                              ? 'bg-accent/10 border-accent/40 text-foreground'
                              : 'bg-card border-border hover:bg-secondary/60 text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant="secondary">
                                {s.type}
                              </Badge>
                              {s.targetAudience === 'heads_only' ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0 gap-1 inline-flex items-center">
                                  <Crown className="w-3 h-3" />
                                  <span>Heads &amp; Sub-Heads</span>
                                </Badge>
                              ) : s.targetAudience === 'teams_only' ? (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0 truncate max-w-[130px] gap-1 inline-flex items-center">
                                  <Users className="w-3 h-3" />
                                  <span>{s.audienceLabel || 'Wings'}</span>
                                </Badge>
                              ) : null}
                              {s.targetYears && s.targetYears.length > 0 && (
                                <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] px-1.5 py-0 gap-1 inline-flex items-center">
                                  <GraduationCap className="w-3 h-3" />
                                  <span>{s.targetYears.join(', ')}</span>
                                </Badge>
                              )}
                            </div>
                            {s.isActive === 'true' ? (
                              <Badge variant="success" className="gap-1.5 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                                Live
                                <span className="font-mono tabular-nums">{s.attendeeCount}</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="shrink-0">Ended</Badge>
                            )}
                          </div>

                          <div className="font-medium text-sm mt-2">{s.title}</div>
                          <div className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </div>

                          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[12px] text-muted-foreground">
                            <span className="font-mono">{s?.startTime ? new Date(s.startTime).toLocaleDateString() : 'N/A'}</span>
                            <span className="text-[11px] truncate max-w-[140px]">{s.audienceLabel || 'Open Session'}</span>
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
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 h-full overflow-y-auto pr-1">
              {selectedSession ? (
                <>
                  <Card className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 ${selectedSession.isActive === 'true' ? 'border-emerald-500/40 dark:border-emerald-500/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedSession.isActive === 'true' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-foreground flex items-center gap-2 flex-wrap">
                          {selectedSession.title}
                          {selectedSession.targetAudience === 'heads_only' && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] gap-1 inline-flex items-center">
                              <Crown className="w-3.5 h-3.5" />
                              <span>Heads &amp; Sub-Heads</span>
                            </Badge>
                          )}
                          {selectedSession.targetAudience === 'teams_only' && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px] gap-1 inline-flex items-center">
                              <Users className="w-3.5 h-3.5" />
                              <span>{selectedSession.audienceLabel || 'Wings Restricted'}</span>
                            </Badge>
                          )}
                          {selectedSession.targetYears && selectedSession.targetYears.length > 0 && (
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[11px] gap-1 inline-flex items-center">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>{selectedSession.targetYears.join(', ')}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Status: <strong className={selectedSession.isActive === 'true' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{selectedSession.isActive === 'true' ? 'Active Live QR' : 'Session Ended / QR Closed'}</strong>
                          <span className="mx-1.5">·</span>
                          Audience: <strong className="text-foreground">{selectedSession.audienceLabel || 'Open to All Members'}</strong>
                          {selectedSession.targetYears && selectedSession.targetYears.length > 0 && (
                            <>
                              <span className="mx-1.5">·</span>
                              Years: <strong className="text-foreground">{selectedSession.targetYears.join(', ')}</strong>
                            </>
                          )}
                        </div>
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

                  {/* Real-time Attendees Feed with Dedicated Search & Custom Scrollbar */}
                  <Card className="p-5 space-y-3.5 border-border rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">Real-time Check-ins</h3>
                        <Badge variant="success" className="tabular-nums font-mono text-xs">
                          {sessionDetail?.attendeeCount || 0} Total
                        </Badge>
                      </div>

                      {/* Attendee search bar */}
                      <input
                        type="text"
                        placeholder="Search attendee by name or roll..."
                        value={attendeeSearch}
                        onChange={(e) => setAttendeeSearch(e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-border bg-secondary/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64"
                      />
                    </div>

                    {/* Attendance feed — scrollable with custom-scroll */}
                    <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scroll pr-1.5">
                      {(() => {
                        const rawAttendees = sessionDetail?.attendees || [];
                        const filteredAttendees = rawAttendees.filter((a: any) => {
                          if (!attendeeSearch.trim()) return true;
                          const q = attendeeSearch.toLowerCase();
                          return a.name?.toLowerCase().includes(q) || a.rollNumber?.toLowerCase().includes(q);
                        });

                        if (filteredAttendees.length > 0) {
                          return filteredAttendees.map((a: any) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-secondary/40 transition-colors text-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-foreground text-sm shrink-0">
                                  {a.name?.charAt(0) || 'M'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">{a.name}</div>
                                  <div className="font-mono text-xs text-muted-foreground truncate" title={a.rollNumber}>
                                    {a.rollNumber}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <Badge variant={a.status === 'late' ? 'warning' : 'success'} className="capitalize text-[11px]">
                                  {a.status}
                                </Badge>
                                <div className="font-mono text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                                  {new Date(a.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ));
                        }

                        return (
                          <EmptyState
                            icon={Users}
                            title={attendeeSearch ? 'No matching check-ins' : 'No check-ins yet'}
                            description={attendeeSearch ? 'Try a different name or roll number.' : 'No members have checked in for this session yet.'}
                          />
                        );
                      })()}
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
