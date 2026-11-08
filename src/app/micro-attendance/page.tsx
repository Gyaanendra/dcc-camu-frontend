'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  FileQuestion,
  Sparkles,
  ShieldAlert,
  Loader2,
  MapPin,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  code: string;
  status: string;
}

interface SessionItem {
  id: string;
  eventId: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  isActive: string;
}

interface TeamMember {
  id: string;
  userId: string;
  roleInTeam: 'leader' | 'member' | 'volunteer';
  name: string;
  rollNumber: string;
  academicYear: string;
  email: string;
  avatarUrl?: string | null;
  position: string;
  attendance?: {
    id: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    notes?: string | null;
    markedById: string;
    markedAt: string;
    updatedById?: string | null;
    updatedAt?: string | null;
  } | null;
}

interface MicroTeam {
  id: string;
  name: string;
  code: string;
  isLeadershipManaged: number;
  description?: string;
  leader?: {
    id: string;
    name: string;
    rollNumber: string;
    avatarUrl?: string | null;
  } | null;
  memberCount: number;
  members: TeamMember[];
  assignedSessionIds: string[];
}

export default function MicroAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [teams, setTeams] = useState<MicroTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Local attendance status tracking: userId -> { status, notes }
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: 'present' | 'late' | 'absent' | 'excused'; notes: string }>
  >({});
  const [showNotesForUser, setShowNotesForUser] = useState<string | null>(null);

  // Load data for the selected session
  const loadTeams = async (targetSessionId?: string) => {
    try {
      setLoading(true);
      const res = await api.getMyMicroTeams({
        sessionId: targetSessionId || selectedSessionId,
      });

      setEvent(res.event);
      setSessions(res.sessions || []);
      setTeams(res.teams || []);
      setIsAdmin(Boolean(res.isAdmin));

      // Auto-select session if none selected
      let curSession = targetSessionId || selectedSessionId;
      if (!curSession && res.sessions && res.sessions.length > 0) {
        curSession = res.sessions[0].id;
        setSelectedSessionId(curSession);
      }

      // Auto-select team if none selected
      if (!selectedTeamId && res.teams && res.teams.length > 0) {
        setSelectedTeamId(res.teams[0].id);
      }

      // Initialize attendance state from server data for current team
      const curTeam = res.teams?.find((t: MicroTeam) => t.id === (selectedTeamId || res.teams[0]?.id));
      if (curTeam) {
        syncAttendanceState(curTeam);
      }
    } catch (err: any) {
      console.error('Failed to load POC micro teams:', err);
      toast.error(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const syncAttendanceState = (team: MicroTeam) => {
    const nextState: Record<string, { status: 'present' | 'late' | 'absent' | 'excused'; notes: string }> = {};
    for (const m of team.members) {
      nextState[m.userId] = {
        status: m.attendance?.status || 'present',
        notes: m.attendance?.notes || '',
      };
    }
    setAttendanceState(nextState);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    loadTeams(sessionId);
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const chosen = teams.find((t) => t.id === teamId);
    if (chosen) syncAttendanceState(chosen);
  };

  const handleStatusChange = (userId: string, status: 'present' | 'late' | 'absent' | 'excused') => {
    setAttendanceState((prev) => ({
      ...prev,
      [userId]: {
        status,
        notes: prev[userId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (userId: string, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [userId]: {
        status: prev[userId]?.status || 'present',
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    if (!activeTeam) return;
    const nextState = { ...attendanceState };
    activeTeam.members.forEach((m) => {
      nextState[m.userId] = {
        status: 'present',
        notes: nextState[m.userId]?.notes || '',
      };
    });
    setAttendanceState(nextState);
    toast.success('Marked all members as Present');
  };

  const handleSubmitAttendance = async () => {
    if (!activeTeam || !activeSession) {
      toast.error('Session and team must be selected');
      return;
    }

    try {
      setSubmitting(true);
      const records = activeTeam.members.map((m) => {
        const entry = attendanceState[m.userId] || { status: 'present', notes: '' };
        return {
          userId: m.userId,
          status: entry.status,
          notes: entry.notes || undefined,
        };
      });

      const res = await api.submitMicroAttendanceBatch({
        sessionId: activeSession.id,
        microTeamId: activeTeam.id,
        records,
      });

      toast.success(res.message || 'Attendance saved successfully!');
      // Refresh to pull updated audit details
      await loadTeams(activeSession.id);
    } catch (err: any) {
      console.error('Save attendance failed:', err);
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Status button variant styling
  const getButtonClass = (userId: string, targetStatus: 'present' | 'late' | 'absent' | 'excused') => {
    const isSelected = attendanceState[userId]?.status === targetStatus;

    if (!isSelected) {
      return 'border border-border/70 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground';
    }

    switch (targetStatus) {
      case 'present':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/10 font-bold';
      case 'late':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm shadow-amber-500/10 font-bold';
      case 'absent':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-sm shadow-rose-500/10 font-bold';
      case 'excused':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm shadow-sky-500/10 font-bold';
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <Navbar />

          <main className="flex-1 px-3.5 sm:px-6 py-4 max-w-4xl mx-auto w-full">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <CalendarCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Micro Attendance
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {event ? `${event.title} (${event.code})` : 'Summit & Session Attendance Portal'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTeams(selectedSessionId)}
                  disabled={loading}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {isAdmin && (
                  <Badge variant="outline" className="border-accent/40 text-accent bg-accent/5 text-[11px] px-2 py-0.5">
                    Leadership Mode
                  </Badge>
                )}
              </div>
            </div>

            {loading && !event ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                <p className="text-sm text-muted-foreground">Loading your assigned micro-teams...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="bg-card border border-border/70 rounded-xl p-8 text-center my-6 shadow-sm">
                <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Micro-Teams Assigned</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  You are not currently designated as a Point of Contact (POC) for any active micro-team in this event.
                  If you are a team leader, please contact DCC Leadership or Tech Team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Session & Team Switchers (Mobile-first large touch targets) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-card/60 p-3 rounded-xl border border-border/70 backdrop-blur-sm">
                  {/* Session Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Summit Session
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSessionId}
                        onChange={(e) => handleSessionChange(e.target.value)}
                        className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Team Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Assigned Team ({teams.length})
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.code}) {t.isLeadershipManaged === 1 ? '— Dignitary Protocol' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Active Session Info Bar */}
                {activeSession && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs">
                    <div className="flex items-center gap-1.5 text-accent font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeSession.location || 'Auditorium'}</span>
                      <span className="text-border">|</span>
                      <span>
                        {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(activeSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleMarkAllPresent}
                        className="h-7 text-xs font-semibold gap-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Mark All Present
                      </Button>
                    </div>
                  </div>
                )}

                {/* Team Roster & Mobile Check-in Cards */}
                {activeTeam && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>Roster ({activeTeam.members.length} members)</span>
                      <span>Tap status to mark attendance</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {activeTeam.members.map((member) => {
                        const curStatus = attendanceState[member.userId]?.status || 'present';
                        const curNotes = attendanceState[member.userId]?.notes || '';
                        const hasAudit = member.attendance?.markedAt;

                        return (
                          <div
                            key={member.userId}
                            className="bg-card border border-border/70 rounded-xl p-3 sm:p-4 shadow-sm transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Member Identity */}
                              <div className="flex items-center gap-3 min-w-0">
                                <MemberAvatar
                                  src={member.avatarUrl}
                                  name={member.name}
                                  className="w-10 h-10 shrink-0 border border-border/60"
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-foreground truncate">
                                      {member.name}
                                    </h4>
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] px-1.5 py-0 uppercase font-semibold ${
                                        member.roleInTeam === 'leader'
                                          ? 'bg-accent/15 text-accent border border-accent/30'
                                          : member.roleInTeam === 'volunteer'
                                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {member.roleInTeam}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                    <span className="font-mono">{member.rollNumber}</span>
                                    <span>•</span>
                                    <span>{member.academicYear}</span>
                                    {hasAudit && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                          <CheckCircle2 className="w-2.5 h-2.5" /> Saved
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Big Tactile Action Buttons (Mobile First) */}
                              <div className="grid grid-cols-4 gap-1.5 sm:w-auto w-full">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(member.userId, 'present')}
                                  className={`py-2 px-2.5 rounded-lg text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${getButtonClass(
                                    member.userId,
                                    'present'
                                  )}`}
                                >
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Present</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(member.userId, 'late')}
                                  className={`py-2 px-2.5 rounded-lg text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${getButtonClass(
                                    member.userId,
                                    'late'
                                  )}`}
                                >
                                  <Clock className="w-4 h-4 shrink-0" />
                                  <span>Late</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(member.userId, 'absent')}
                                  className={`py-2 px-2.5 rounded-lg text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${getButtonClass(
                                    member.userId,
                                    'absent'
                                  )}`}
                                >
                                  <XCircle className="w-4 h-4 shrink-0" />
                                  <span>Absent</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(member.userId, 'excused')}
                                  className={`py-2 px-2.5 rounded-lg text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${getButtonClass(
                                    member.userId,
                                    'excused'
                                  )}`}
                                >
                                  <FileQuestion className="w-4 h-4 shrink-0" />
                                  <span>Excused</span>
                                </button>
                              </div>
                            </div>

                            {/* Optional Notes Toggle & Input */}
                            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                              {showNotesForUser === member.userId ? (
                                <div className="w-full flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add reason/remarks (optional)..."
                                    value={curNotes}
                                    onChange={(e) => handleNotesChange(member.userId, e.target.value)}
                                    className="flex-1 bg-background border border-border/70 rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowNotesForUser(null)}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    Done
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowNotesForUser(member.userId)}
                                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {curNotes ? (
                                    <span className="italic text-foreground">Note: "{curNotes}"</span>
                                  ) : (
                                    <span>+ Add remark</span>
                                  )}
                                </button>
                              )}

                              {member.attendance?.markedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  Last synced: {new Date(member.attendance.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Floating Save Button for Mobile */}
                    <div className="sticky bottom-4 pt-2">
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleSubmitAttendance}
                        disabled={submitting}
                        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Recording Attendance...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Submit {activeTeam.name} Attendance ({activeTeam.members.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
