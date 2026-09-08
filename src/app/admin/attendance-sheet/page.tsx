'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Table2, RefreshCw, Check, Clock, Minus } from 'lucide-react';

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
  attended: number;
  attendanceRate: number;
  records: Record<string, string | null>;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function AttendanceSheetPage() {
  const [sessions, setSessions] = useState<SheetSession[]>([]);
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 dash-card">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Club Records
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Attendance Sheet
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Full member × session matrix — {members.length} members across {sessions.length} sessions
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm shadow-sm"
                >
                  <option value="ALL">All Wings</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
                  title="Refresh sheet"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <PageLoader message="Building attendance matrix..." />
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center dash-card">
                <Table2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No sessions recorded yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">Create a session to start building the sheet.</p>
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Present</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Late</span>
                  <span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> Absent / no record</span>
                </div>

                {/* Matrix table */}
                <div className="dash-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="text-left text-sm border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-20 bg-secondary/60 backdrop-blur p-3 min-w-[220px] border-b border-r border-border">
                            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Member / Wing</span>
                          </th>
                          {sessions.map(s => (
                            <th
                              key={s.id}
                              className="p-3 min-w-[110px] max-w-[130px] border-b border-border align-bottom"
                              title={`${s.title} — ${new Date(s.startTime).toLocaleString()}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground truncate">{s.title}</span>
                                {s.isActive === 'true' && (
                                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live now" />
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {fmtDate(s.startTime)} · {fmtTime(s.startTime)}
                              </div>
                            </th>
                          ))}
                          <th className="p-3 min-w-[80px] border-b border-l border-border text-right">
                            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Rate</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) =>
                          row.kind === 'team' ? (
                            <tr key={`team-${row.teamName}`}>
                              <td colSpan={sessions.length + 2} className="sticky left-0 bg-secondary/40 p-2 px-3 border-b border-border">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  {row.teamName} · {row.count} members
                                </span>
                              </td>
                            </tr>
                          ) : (
                            <tr key={row.member!.id} className="hover:bg-secondary/40 transition-colors">
                              <td className="sticky left-0 z-10 bg-card p-3 border-b border-r border-border">
                                <div className="font-semibold text-foreground truncate">{row.member!.name}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">{row.member!.rollNumber}</div>
                              </td>
                              {sessions.map(s => {
                                const status = row.member!.records[s.id];
                                return (
                                  <td key={s.id} className="p-3 border-b border-border text-center">
                                    {status === 'present' ? (
                                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                                    ) : status === 'late' ? (
                                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto" />
                                    ) : (
                                      <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                              <td className="p-3 border-b border-l border-border text-right font-bold text-foreground tabular-nums">
                                {row.member!.attendanceRate}%
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
