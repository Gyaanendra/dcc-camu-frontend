'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/layout/PageLoader';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Table2, RefreshCw, Check, Clock, Minus, Loader2, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SheetSession {
  id: string;
  title: string;
  type: string;
  startTime: string;
  isActive: string;
}

interface SheetMember {
  id: string;
  name: string;
  rollNumber: string;
  teamId: string | null;
  teamName: string;
  teamCode: string;
  role?: string;
  avatarUrl?: string;
  attended: number;
  attendanceRate: number;
  records: Record<string, string | null>;
}

// startTime can be missing on legacy rows — never render "Invalid Date".
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AttendanceSheetPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'advisor';
  const [sessions, setSessions] = useState<SheetSession[]>([]);
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  // `${memberId}:${sessionId}` of the cell with an in-flight toggle, if any.
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAttendanceSheet();
      setSessions(res.sessions || []);
      setMembers(res.members || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load attendance sheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Admin: flip a single matrix cell (present <-> absent) with an optimistic
  // update. The member snapshot is restored verbatim if the API rejects.
  const handleToggleCell = async (member: SheetMember, session: SheetSession) => {
    if (updatingCell) return;

    const currentStatus = member.records[session.id] || null;
    const action: 'mark_present' | 'mark_absent' = currentStatus ? 'mark_absent' : 'mark_present';
    const newStatus: string | null = currentStatus ? null : 'present';

    const snapshot = member;
    const newRecords = { ...member.records, [session.id]: newStatus };
    const attended = Object.values(newRecords).filter(Boolean).length;

    setMembers(prev =>
      prev.map(m =>
        m.id === member.id
          ? {
              ...m,
              records: newRecords,
              attended,
              attendanceRate: sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0,
            }
          : m
      )
    );
    setUpdatingCell(`${member.id}:${session.id}`);

    try {
      await api.manualAttendance({ sessionId: session.id, userId: member.id, action });
      toast.success(
        action === 'mark_present' ? `Marked ${member.name} present` : `Marked ${member.name} absent`
      );
    } catch (e: any) {
      setMembers(prev => prev.map(m => (m.id === snapshot.id ? snapshot : m)));
      toast.error(e.message || 'Failed to update attendance');
    } finally {
      setUpdatingCell(null);
    }
  };

  const teams = useMemo(() => {
    const seen = new Map<string, string>();
    members.forEach(m => seen.set(m.teamId || 'none', m.teamName));
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [members]);

  const visibleMembers = useMemo(
    () => teamFilter === 'ALL' ? members : members.filter(m => (m.teamId || 'none') === teamFilter),
    [members, teamFilter]
  );

  // Insert team separator rows when viewing all teams
  const rows = useMemo(() => {
    if (teamFilter !== 'ALL') return visibleMembers.map(m => ({ kind: 'member' as const, member: m }));
    const out: Array<{ kind: 'team' | 'member'; member?: SheetMember; teamName?: string; count?: number }> = [];
    let currentTeam = '';
    visibleMembers.forEach(m => {
      if (m.teamName !== currentTeam) {
        currentTeam = m.teamName;
        out.push({ kind: 'team', teamName: m.teamName, count: visibleMembers.filter(x => x.teamName === currentTeam).length });
      }
      out.push({ kind: 'member', member: m });
    });
    return out;
  }, [visibleMembers, teamFilter]);

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <PageHeader
              kicker="Club Records"
              title="Attendance Sheet"
              description={`Full member × session matrix — ${members.length} people (${members.filter(m => m.role === 'user').length} members, ${members.filter(m => m.role === 'admin').length} admins, ${members.filter(m => m.role === 'advisor').length} advisors) across ${sessions.length} sessions`}
              actions={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadData}
                  title="Refresh sheet"
                  className="focus-orange"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              }
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Wings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Wings</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-auto font-mono text-[12px] text-muted-foreground tabular-nums">
                {visibleMembers.length} of {members.length}
              </span>
            </div>

            {isLoading ? (
              <PageLoader message="Building attendance matrix..." />
            ) : sessions.length === 0 ? (
              <Card className="p-12 text-center">
                <Table2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No sessions recorded yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">Create a session to start building the sheet.</p>
              </Card>
            ) : (
              <>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Present</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Late</span>
                  <span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> Absent / no record</span>
                  {!isReadOnly && (
                    <span className="flex items-center gap-1.5 ml-auto text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-3 py-1">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      Tip: Click any cell to manually toggle attendance
                    </span>
                  )}
                </div>

                {/* Matrix table */}
                <Card className="overflow-hidden p-0">
                  <div className="overflow-auto max-h-[60vh] table-sticky-head">
                    <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="sticky left-0 z-20 bg-secondary/60 backdrop-blur p-3 min-w-[220px] border-b border-r border-border">
                          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Member / Wing</span>
                        </TableHead>
                        {sessions.map(s => (
                          <TableHead
                            key={s.id}
                            className="p-3 min-w-[110px] max-w-[130px] border-b border-border align-bottom"
                            title={s.startTime ? `${s.title} — ${new Date(s.startTime).toLocaleString()}` : s.title}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground truncate">{s.title}</span>
                              {s.isActive === 'true' && (
                                <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live now" />
                              )}
                            </div>
                            <div className="font-mono text-[13px] text-muted-foreground font-normal mt-0.5">
                              {fmtDate(s.startTime)} · {fmtTime(s.startTime)}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="p-3 min-w-[80px] border-b border-l border-border text-right">
                          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Rate</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) =>
                        row.kind === 'team' ? (
                          <TableRow key={`team-${row.teamName}`} className="hover:bg-transparent">
                            <TableCell colSpan={sessions.length + 2} className="sticky left-0 bg-secondary/40 p-2 px-3 border-b border-border">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {row.teamName} · {row.count} members
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={row.member!.id}>
                            <TableCell className="sticky left-0 z-10 bg-card p-2.5 sm:p-3 border-b border-r border-border">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 border border-border hover:scale-110 transition-transform duration-150 shrink-0">
                                  {row.member!.avatarUrl && <AvatarImage src={row.member!.avatarUrl} alt={row.member!.name} />}
                                  <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                    {row.member!.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">{row.member!.name}</div>
                                  <div className="font-mono text-[13px] text-muted-foreground truncate" title={row.member!.rollNumber}>{row.member!.rollNumber}</div>
                                </div>
                              </div>
                            </TableCell>
                            {sessions.map(s => {
                              const member = row.member!;
                              const status = member.records[s.id];
                              const cellKey = `${member.id}:${s.id}`;
                              const isUpdating = updatingCell === cellKey;

                              const cellIcon = isUpdating ? (
                                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mx-auto" />
                              ) : status === 'present' ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : status === 'late' ? (
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                              );

                              return (
                                <TableCell key={s.id} className="p-3 border-b border-border text-center">
                                  {isReadOnly ? (
                                    cellIcon
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCell(member, s)}
                                      disabled={isUpdating || updatingCell !== null}
                                      title={status ? `Mark ${member.name} absent` : `Mark ${member.name} present`}
                                      aria-label={status ? `Mark ${member.name} absent for ${s.title}` : `Mark ${member.name} present for ${s.title}`}
                                      className="hover:bg-accent/20 cursor-pointer rounded-md p-1 transition-colors disabled:cursor-wait disabled:opacity-60 focus-orange"
                                    >
                                      {cellIcon}
                                    </button>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="p-3 border-b border-l border-border text-right font-bold text-foreground tabular-nums">
                              {row.member!.attendanceRate}%
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
