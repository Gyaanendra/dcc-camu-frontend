'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { Calendar, MapPin, PowerOff, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSessionsPage() {
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
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 dash-card">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Event Management
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Sessions & Live QR
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Schedule sessions, project dynamic QR codes, and monitor live check-ins</p>
              </div>

              <div className="flex items-center gap-2">
                <CreateSessionModal teams={teams} onCreated={loadData} />
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
                  title="Refresh Sessions"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <PageLoader message="Loading session records..." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sessions List */}
                <div className="space-y-3">
                  <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Sessions Directory
                  </h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {isLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-card h-28 animate-pulse" />
                      ))
                    ) : sessions.length > 0 ? (
                      sessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                            selectedSession?.id === s.id
                              ? 'bg-accent/10 border-accent/40 text-foreground'
                              : 'bg-card border-border hover:bg-secondary/60 text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                              {s.type}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                s.isActive === 'true' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                              }`}
                            >
                              {s.isActive === 'true' ? '● LIVE' : 'ENDED'}
                            </span>
                          </div>

                          <div className="font-bold text-sm mt-2">{s.title}</div>
                          <div className="text-[11px] mt-1 flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2 border-t border-border text-muted-foreground">
                            <span>{new Date(s.startTime).toLocaleDateString()}</span>
                            <span className="text-foreground font-bold tabular-nums">
                              {s.attendeeCount} attended
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border">
                        No sessions created yet. Click "Create New Session" above to get started.
                      </div>
                    )}
                  </div>
                </div>

            {/* Selected Session QR Broadcast & Attendees Feed */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSession ? (
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 dash-card">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedSession.isActive === 'true' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{selectedSession.title}</div>
                        <div className="text-[11px] text-muted-foreground">Status: <strong className={selectedSession.isActive === 'true' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>{selectedSession.isActive === 'true' ? 'Active Live QR' : 'Session Ended / QR Closed'}</strong></div>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleSessionStatus}
                      disabled={isUpdatingStatus}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm ${
                        selectedSession.isActive === 'true'
                          ? 'bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20'
                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      }`}
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
                    </button>
                  </div>

                  <QRDisplayCard
                    title={selectedSession.title}
                    qrCodeToken={selectedSession.qrCodeToken}
                    subtitle={selectedSession.isActive === 'true' ? "Broadcast on Screen for Member Check-in" : "Session Closed (Attendance Disabled)"}
                    location={selectedSession.location}
                  />

                  {/* Real-time Attendees Feed */}
                  <div className="p-6 dash-card space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <h3 className="text-sm font-bold text-foreground">Real-time Attendance Feed</h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold tabular-nums">
                        {sessionDetail?.attendeeCount || 0} Checked In
                      </span>
                    </div>

                    <div className="space-y-2">
                      {sessionDetail?.attendees?.length > 0 ? (
                        sessionDetail.attendees.map((a: any) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground text-sm">
                                {a.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{a.name}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">{a.rollNumber}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  a.status === 'late'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {a.status}
                              </span>
                              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                {new Date(a.scannedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          No members have checked in for this session yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground text-sm dash-card">
                  Select a session to view QR code.
                </div>
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
