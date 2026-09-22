'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { DatabaseToolbar } from '@/components/ui/database-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Table2,
  RefreshCw,
  Check,
  Clock,
  Minus,
  Loader2,
  MousePointerClick,
  Users,
  LayoutGrid,
  Smartphone,
  Ban,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock3,
  UserX,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/components/ui/member-avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getAcademicYear,
  getYearShortBadge,
  getYearBadgeColor,
  ACADEMIC_YEAR_OPTIONS,
  AcademicYear,
} from '@/lib/academic-year';

interface SheetSession {
  id: string;
  title: string;
  type: string;
  startTime: string;
  isActive: string;
  targetAudience?: 'all' | 'heads_only' | 'teams_only';
  targetTeamIds?: string[];
}

interface SheetMember {
  id: string;
  name: string;
  rollNumber: string;
  academicYear?: AcademicYear;
  position?: string;
  teamId: string | null;
  teamName: string;
  teamCode: string;
  role?: string;
  isExempt?: boolean;
  avatarUrl?: string;
  attended: number;
  eligibleSessions: number;
  attendanceRate: number;
  records: Record<string, string | null>;
}

// Formatters for session times
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AttendanceSheetPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'advisor';

  // Data states
  const [sessions, setSessions] = useState<SheetSession[]>([]);
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode: Matrix Grid or By-Session (Mobile-First Card Mode)
  const [viewMode, setViewMode] = useState<'matrix' | 'session'>('matrix');

  // Filters
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'members' | 'advisors'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected session for By-Session view
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<
    'ALL' | 'present' | 'late' | 'absent' | 'not_in_club'
  >('ALL');

  // `${memberId}:${sessionId}` in-flight toggle
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAttendanceSheet();
      const loadedSessions: SheetSession[] = res.sessions || [];
      const loadedMembers: SheetMember[] = res.members || [];

      setSessions(loadedSessions);
      setMembers(loadedMembers);

      if (loadedSessions.length > 0) {
        setSelectedSessionId((prev) => {
          if (prev && loadedSessions.some((s) => s.id === prev)) return prev;
          const live = loadedSessions.find((s) => s.isActive === 'true');
          return live ? live.id : loadedSessions[0].id;
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load attendance sheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-status manual attendance updater
  const handleSetStatus = async (
    member: SheetMember,
    session: SheetSession,
    targetStatus: 'present' | 'late' | 'absent' | 'not_in_club'
  ) => {
    if (updatingCell || isReadOnly) return;

    const cellKey = `${member.id}:${session.id}`;
    const previousRecords = { ...member.records };
    const previousAttended = member.attended;
    const previousEligible = member.eligibleSessions;
    const previousRate = member.attendanceRate;

    const newRecordValue = targetStatus === 'absent' ? null : targetStatus;
    const updatedRecords = { ...member.records, [session.id]: newRecordValue };

    // Recompute attended & eligible
    let newAttended = 0;
    let newEligible = 0;

    for (const s of sessions) {
      const st = updatedRecords[s.id];
      if (member.isExempt) {
        if (st === 'present' || st === 'late') newAttended++;
      } else if (st === 'not_in_club' || st === 'joined_later' || st === 'not_in_team' || st === 'not_a_head') {
        // Excluded from denominator
      } else if (st === 'present' || st === 'late') {
        newAttended++;
        newEligible++;
      } else {
        // null = unexcused absence
        newEligible++;
      }
    }

    const newRate = member.isExempt
      ? 100
      : newEligible > 0
      ? Math.round((newAttended / newEligible) * 100)
      : 100;

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              records: updatedRecords,
              attended: newAttended,
              eligibleSessions: newEligible,
              attendanceRate: newRate,
            }
          : m
      )
    );
    setUpdatingCell(cellKey);

    const actionMap = {
      present: 'mark_present',
      late: 'mark_late',
      absent: 'mark_absent',
      not_in_club: 'mark_not_in_club',
    } as const;

    try {
      await api.manualAttendance({
        sessionId: session.id,
        userId: member.id,
        action: actionMap[targetStatus],
      });

      const labelMap = {
        present: 'present (on time)',
        late: 'late',
        absent: 'absent',
        not_in_club: 'not in club (exempt)',
      };
      toast.success(`Marked ${member.name} as ${labelMap[targetStatus]}`);
    } catch (e: any) {
      // Revert on failure
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                records: previousRecords,
                attended: previousAttended,
                eligibleSessions: previousEligible,
                attendanceRate: previousRate,
              }
            : m
        )
      );
      toast.error(e.message || 'Failed to update attendance');
    } finally {
      setUpdatingCell(null);
    }
  };

  const teams = useMemo(() => {
    const seen = new Map<string, string>();
    members.forEach((m) => seen.set(m.teamId || 'none', m.teamName));
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [members]);

  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0] || null;
  }, [sessions, selectedSessionId]);

  // Filtered members list
  const visibleMembers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return members.filter((m) => {
      const matchesTeam = teamFilter === 'ALL' || (m.teamId || 'none') === teamFilter;
      const memberYear = m.academicYear || getAcademicYear(m.rollNumber);
      const matchesYear = yearFilter === 'ALL' || memberYear === yearFilter;
      const matchesRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'advisors'
          ? m.role === 'advisor'
          : m.role !== 'advisor';

      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.rollNumber.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q));

      return matchesTeam && matchesYear && matchesRole && matchesSearch;
    });
  }, [members, teamFilter, yearFilter, roleFilter, searchTerm]);

  // Grouped rows for Matrix View
  const matrixRows = useMemo(() => {
    if (teamFilter !== 'ALL') return visibleMembers.map((m) => ({ kind: 'member' as const, member: m }));
    const out: Array<{ kind: 'team' | 'member'; member?: SheetMember; teamName?: string; count?: number }> = [];
    let currentTeam = '';
    visibleMembers.forEach((m) => {
      if (m.teamName !== currentTeam) {
        currentTeam = m.teamName;
        out.push({
          kind: 'team',
          teamName: m.teamName,
          count: visibleMembers.filter((x) => x.teamName === currentTeam).length,
        });
      }
      out.push({ kind: 'member', member: m });
    });
    return out;
  }, [visibleMembers, teamFilter]);

  // Filtered members for By-Session view
  const sessionMembers = useMemo(() => {
    if (!selectedSession) return [];
    return visibleMembers.filter((m) => {
      if (sessionStatusFilter === 'ALL') return true;
      const status = m.records[selectedSession.id];
      if (sessionStatusFilter === 'present') return status === 'present';
      if (sessionStatusFilter === 'late') return status === 'late';
      if (sessionStatusFilter === 'not_in_club') return status === 'not_in_club';
      if (sessionStatusFilter === 'absent') return !status;
      return true;
    });
  }, [visibleMembers, selectedSession, sessionStatusFilter]);

  // Session stats for By-Session view
  const sessionStats = useMemo(() => {
    if (!selectedSession) return { present: 0, late: 0, absent: 0, notInClub: 0, total: 0 };
    let present = 0;
    let late = 0;
    let notInClub = 0;
    let absent = 0;

    visibleMembers.forEach((m) => {
      const st = m.records[selectedSession.id];
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'not_in_club') notInClub++;
      else absent++;
    });

    return {
      present,
      late,
      absent,
      notInClub,
      total: visibleMembers.length,
    };
  }, [selectedSession, visibleMembers]);

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Attendance' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          {/* Full-width container utilizing maximal screen width without arbitrary max-w-7xl truncation */}
          <main className="flex-1 min-w-0 p-3 sm:p-6 w-full max-w-[99%] 2xl:max-w-none mx-auto space-y-4">
            <PageHeader
              icon={Table2}
              crumbs={[{ label: 'Admin' }, { label: 'Attendance' }]}
              title="Attendance sheet"
              description={`Full member × session matrix — ${members.length} people across ${sessions.length} sessions with proration & multi-status manual control`}
              actions={
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle: Matrix vs Mobile-First By-Session */}
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => setViewMode('matrix')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        viewMode === 'matrix'
                          ? 'bg-background text-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Spreadsheet Matrix View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Matrix Sheet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('session')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        viewMode === 'session'
                          ? 'bg-background text-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Mobile-First By-Session List View"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">By Session</span>
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadData}
                    title="Refresh sheet"
                    className="focus-orange h-8 w-8"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              }
            />

            {/* Filter Toolbar with Wing & Academic Year filters */}
            <DatabaseToolbar
              search={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search by name, roll, or position..."
              count={<>{visibleMembers.length} of {members.length}</>}
              className="pb-3 border-b border-border flex-wrap gap-2"
            >
              {/* Wing Filter */}
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-36 sm:w-40 h-8 text-xs">
                  <SelectValue placeholder="All Wings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Wings</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Academic Year Filter */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Years</SelectItem>
                  {ACADEMIC_YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role / Advisor Filter */}
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="members">Members Only</SelectItem>
                  <SelectItem value="advisors">Advisors (Exempt)</SelectItem>
                </SelectContent>
              </Select>
            </DatabaseToolbar>

            {isLoading ? (
              <Card className="overflow-hidden p-6 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 flex-1" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              </Card>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={Table2}
                title="No sessions recorded yet"
                description="Create a session in Sessions & QR to start recording attendance."
              />
            ) : visibleMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members match the current filters"
                description="Try resetting your search query, wing, or academic year filter."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeamFilter('ALL');
                      setYearFilter('ALL');
                      setRoleFilter('ALL');
                      setSearchTerm('');
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            ) : viewMode === 'matrix' ? (
              /* ── MATRIX SPREADSHEET VIEW (Optimized Desktop Space) ── */
              <>
                {/* Legend & Instructions */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                    Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 font-bold" />
                    Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5 text-muted-foreground/60" />
                    Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Not in Club (Exempt)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground font-mono">
                      Joined Later
                    </span>
                    Prorated
                  </span>
                  {!isReadOnly && (
                    <span className="hidden lg:flex items-center gap-1.5 ml-auto text-xs font-medium text-muted-foreground bg-secondary/70 border border-border rounded-full px-3 py-0.5">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      Click any cell to mark Present, Late, Absent, or Not in Club
                    </span>
                  )}
                </div>

                {/* Table Container: High-density dynamic height using available viewport */}
                <Card className="overflow-hidden p-0 border border-border shadow-xs">
                  <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[500px] table-sticky-head">
                    <table className="w-full caption-bottom text-xs border-separate border-spacing-0">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          {/* Sticky Member Column Header */}
                          <TableHead className="sticky top-0 left-0 z-40 bg-secondary/95 backdrop-blur p-2.5 sm:p-3 min-w-[220px] max-w-[260px] border-b border-r border-border shadow-xs">
                            <span className="font-semibold text-foreground">Member / Wing</span>
                          </TableHead>

                          {/* Session Headers */}
                          {sessions.map((s) => (
                            <TableHead
                              key={s.id}
                              className="sticky top-0 z-30 bg-secondary/90 backdrop-blur p-2 sm:p-2.5 min-w-[105px] max-w-[130px] border-b border-r border-border text-center align-bottom"
                              title={`${s.title} — ${fmtDate(s.startTime)} ${fmtTime(s.startTime)}`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-foreground truncate max-w-[90px]">{s.title}</span>
                                {s.isActive === 'true' && (
                                  <span
                                    className="shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
                                    title="Live now"
                                  />
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground font-normal mt-0.5">
                                {fmtDate(s.startTime)}
                              </div>
                              {s.targetAudience === 'heads_only' ? (
                                <span className="inline-block text-[9px] px-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                  Heads
                                </span>
                              ) : s.targetAudience === 'teams_only' ? (
                                <span className="inline-block text-[9px] px-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                  Wings
                                </span>
                              ) : null}
                            </TableHead>
                          ))}

                          {/* Sticky Summary Rate Column */}
                          <TableHead className="sticky top-0 right-0 z-30 bg-secondary/95 backdrop-blur p-2.5 border-b border-l border-border text-right min-w-[85px]">
                            <span className="font-semibold text-foreground">Rate</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {matrixRows.map((row, idx) =>
                          row.kind === 'team' ? (
                            <TableRow key={`team-${row.teamName}-${idx}`} className="hover:bg-transparent">
                              <TableCell
                                colSpan={sessions.length + 2}
                                className="sticky left-0 bg-secondary/40 p-2 px-3 border-b border-border"
                              >
                                <span className="font-semibold text-foreground text-xs">
                                  {row.teamName} · {row.count} members
                                </span>
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={row.member!.id} className="group hover:bg-secondary/30 transition-colors">
                              {/* Sticky Member Identity Cell */}
                              <TableCell className="sticky left-0 z-20 bg-card group-hover:bg-secondary/80 transition-colors p-2 sm:p-2.5 border-b border-r border-border shadow-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MemberAvatar
                                    src={row.member!.avatarUrl}
                                    name={row.member!.name}
                                    className="h-7 w-7 border border-border shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-foreground truncate">{row.member!.name}</span>
                                      {row.member!.academicYear && (
                                        <span
                                          className={`text-[10px] px-1 py-0 rounded border font-mono shrink-0 ${getYearBadgeColor(
                                            row.member!.academicYear
                                          )}`}
                                        >
                                          {getYearShortBadge(row.member!.rollNumber)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground truncate">
                                      <span>{row.member!.rollNumber}</span>
                                      {row.member!.isExempt && (
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">· Advisor</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Session Matrix Cells */}
                              {sessions.map((s) => {
                                const member = row.member!;
                                const status = member.records[s.id];
                                const cellKey = `${member.id}:${s.id}`;
                                const isUpdating = updatingCell === cellKey;

                                // If member is an advisor -> Exempt
                                if (member.isExempt) {
                                  return (
                                    <TableCell
                                      key={s.id}
                                      className="p-2 border-b border-r border-border text-center text-muted-foreground/60"
                                      title="Advisor: Exempt from attendance"
                                    >
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                                        Exempt
                                      </span>
                                    </TableCell>
                                  );
                                }

                                // Inapplicable session cases
                                if (status === 'joined_later') {
                                  return (
                                    <TableCell
                                      key={s.id}
                                      className="p-2 border-b border-r border-border text-center"
                                      title="Member joined DCC after this session was held (Prorated)"
                                    >
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                                        Joined Later
                                      </span>
                                    </TableCell>
                                  );
                                }

                                if (status === 'not_in_team' || status === 'not_a_head') {
                                  return (
                                    <TableCell
                                      key={s.id}
                                      className="p-2 border-b border-r border-border text-center"
                                      title={
                                        status === 'not_a_head'
                                          ? 'Meeting was for Heads & Leads only'
                                          : 'Meeting was restricted to other wings'
                                      }
                                    >
                                      <span className="text-[10px] px-1 py-0.5 rounded bg-secondary text-muted-foreground/70 font-mono">
                                        Exempt
                                      </span>
                                    </TableCell>
                                  );
                                }

                                // Interactive Cell
                                const renderCellContent = () => {
                                  if (isUpdating) {
                                    return <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin mx-auto" />;
                                  }
                                  if (status === 'present') {
                                    return <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.5]" />;
                                  }
                                  if (status === 'late') {
                                    return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto stroke-[2.5]" />;
                                  }
                                  if (status === 'not_in_club') {
                                    return (
                                      <div className="flex items-center justify-center gap-0.5" title="Not in club at this time">
                                        <Ban className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                      </div>
                                    );
                                  }
                                  // Absent / unexcused
                                  return <Minus className="w-3.5 h-3.5 text-muted-foreground/40 mx-auto" />;
                                };

                                if (isReadOnly) {
                                  return (
                                    <TableCell key={s.id} className="p-2 border-b border-r border-border text-center">
                                      {renderCellContent()}
                                    </TableCell>
                                  );
                                }

                                return (
                                  <TableCell key={s.id} className="p-1.5 border-b border-r border-border text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          disabled={isUpdating || updatingCell !== null}
                                          className="w-full h-8 flex items-center justify-center rounded-md hover:bg-accent/15 cursor-pointer transition-colors focus-orange disabled:opacity-50"
                                          title={`Change status: ${member.name} for ${s.title}`}
                                        >
                                          {renderCellContent()}
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="center" className="w-44 text-xs">
                                        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                                          {member.name.split(' ')[0]} · {s.title.slice(0, 18)}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleSetStatus(member, s, 'present')}
                                          className="cursor-pointer gap-2"
                                        >
                                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
                                          <span>Present (On time)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleSetStatus(member, s, 'late')}
                                          className="cursor-pointer gap-2"
                                        >
                                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 font-bold" />
                                          <span>Late check-in</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleSetStatus(member, s, 'absent')}
                                          className="cursor-pointer gap-2"
                                        >
                                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span>Mark Absent</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleSetStatus(member, s, 'not_in_club')}
                                          className="cursor-pointer gap-2 text-purple-600 dark:text-purple-400"
                                        >
                                          <Ban className="w-3.5 h-3.5" />
                                          <span>Not in club (Exempt)</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                );
                              })}

                              {/* Rate Cell */}
                              <TableCell className="sticky right-0 z-20 bg-card group-hover:bg-secondary/80 transition-colors p-2 sm:p-2.5 border-b border-l border-border text-right font-bold tabular-nums">
                                {row.member!.isExempt ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                                    Exempt
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`text-xs ${
                                        row.member!.attendanceRate >= 75
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : row.member!.attendanceRate >= 50
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-destructive'
                                      }`}
                                    >
                                      {row.member!.attendanceRate}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                      {row.member!.attended}/{row.member!.eligibleSessions}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              /* ── MOBILE-FIRST BY-SESSION LIST VIEW (Quick Attendance Taking on Phones) ── */
              <div className="space-y-4">
                {/* Session Selector & Status Counter Bar */}
                <Card className="p-4 bg-card border border-border shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Select Session</label>
                      <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                        <SelectTrigger className="w-full sm:w-80 h-9 font-medium text-sm">
                          <SelectValue placeholder="Select session..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.isActive === 'true' ? '🟢 ' : ''}
                              {s.title} ({fmtDate(s.startTime)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSession && (
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <Badge variant={selectedSession.isActive === 'true' ? 'success' : 'secondary'}>
                          {selectedSession.isActive === 'true' ? 'Active Live' : 'Ended'}
                        </Badge>
                        <span className="font-mono">{fmtDate(selectedSession.startTime)} · {fmtTime(selectedSession.startTime)}</span>
                        {selectedSession.targetAudience === 'heads_only' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                            👑 Heads Only
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Counters with Quick Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setSessionStatusFilter('ALL')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        sessionStatusFilter === 'ALL'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      All ({sessionStats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionStatusFilter('present')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        sessionStatusFilter === 'present'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present ({sessionStats.present})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionStatusFilter('late')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        sessionStatusFilter === 'late'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <Clock3 className="w-3.5 h-3.5" /> Late ({sessionStats.late})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionStatusFilter('absent')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        sessionStatusFilter === 'absent'
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Absent ({sessionStats.absent})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionStatusFilter('not_in_club')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        sessionStatusFilter === 'not_in_club'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" /> Not in Club ({sessionStats.notInClub})
                    </button>
                  </div>
                </Card>

                {/* Member Card List for Phone Retrieval */}
                <div className="space-y-2">
                  {sessionMembers.map((member) => {
                    if (!selectedSession) return null;
                    const status = member.records[selectedSession.id];
                    const cellKey = `${member.id}:${selectedSession.id}`;
                    const isUpdating = updatingCell === cellKey;

                    return (
                      <Card
                        key={member.id}
                        className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors border ${
                          status === 'present'
                            ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                            : status === 'late'
                            ? 'border-amber-500/40 bg-amber-500/[0.02]'
                            : status === 'not_in_club'
                            ? 'border-purple-500/30 bg-purple-500/[0.02]'
                            : 'border-border bg-card'
                        }`}
                      >
                        {/* Member Identity Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <MemberAvatar
                            src={member.avatarUrl}
                            name={member.name}
                            className="h-10 w-10 border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">{member.name}</span>
                              {member.academicYear && (
                                <span
                                  className={`text-[11px] px-1.5 py-0.5 rounded border font-mono ${getYearBadgeColor(
                                    member.academicYear
                                  )}`}
                                >
                                  {member.academicYear}
                                </span>
                              )}
                              <Badge variant="secondary" className="text-[11px]">
                                {member.teamName}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                              <span>{member.rollNumber}</span>
                              {member.position && <span>· {member.position}</span>}
                              <span className="text-foreground font-medium">
                                · Rate: {member.isExempt ? 'Exempt' : `${member.attendanceRate}%`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Multi-Status Segmented Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {isUpdating ? (
                            <div className="h-8 px-4 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : member.isExempt ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                              Advisor (Exempt)
                            </Badge>
                          ) : status === 'joined_later' ? (
                            <Badge variant="secondary" className="text-xs">
                              Joined Later (Prorated)
                            </Badge>
                          ) : isReadOnly ? (
                            <Badge variant={status === 'present' ? 'success' : status === 'late' ? 'secondary' : 'outline'}>
                              {status || 'Absent'}
                            </Badge>
                          ) : (
                            <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/50 gap-0.5">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(member, selectedSession, 'present')}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  status === 'present'
                                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                }`}
                                title="Mark Present (On time)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(member, selectedSession, 'late')}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  status === 'late'
                                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                }`}
                                title="Mark Late"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Late</span>
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(member, selectedSession, 'absent')}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  !status
                                    ? 'bg-background text-destructive font-semibold shadow-xs border border-border'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                }`}
                                title="Mark Absent"
                              >
                                <Minus className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              {/* Not in Club Button */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(member, selectedSession, 'not_in_club')}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  status === 'not_in_club'
                                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                                    : 'text-muted-foreground hover:text-purple-600 hover:bg-secondary'
                                }`}
                                title="Mark as Not in Club for this meeting (Exempt from denominator)"
                              >
                                <Ban className="w-3 h-3" />
                                <span className="hidden md:inline">Not in club</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
