'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Clock,
  Clock3,
  XCircle,
  AlertTriangle,
  Calendar,
  Building,
  GraduationCap,
  ShieldCheck,
  Check,
  X,
  Minus,
  Crown,
  Search,
  Loader2,
  Mail,
  Shield,
  User,
  Eye,
  History,
  Sparkles,
} from 'lucide-react';
import { getAcademicYear, getYearBadgeColor, getYearShortBadge } from '@/lib/academic-year';
import { api } from '@/lib/api';

interface MemberAnalyticsModalProps {
  member: any | null;
  sessions?: any[];
  isOpen: boolean;
  onClose: () => void;
}

type SessionFilter = 'ALL' | 'ATTENDED' | 'LATE' | 'ABSENT' | 'EXEMPT';

export const MemberAnalyticsModal: React.FC<MemberAnalyticsModalProps> = ({
  member,
  sessions: initialSessions,
  isOpen,
  onClose,
}) => {
  const [enrichedMember, setEnrichedMember] = useState<any>(member);
  const [allSessions, setAllSessions] = useState<any[]>(initialSessions || []);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('ALL');

  // Sync state when incoming props change
  useEffect(() => {
    if (member) {
      setEnrichedMember(member);
    }
  }, [member]);

  useEffect(() => {
    if (initialSessions && initialSessions.length > 0) {
      setAllSessions(initialSessions);
    }
  }, [initialSessions]);

  // Reset filters when modal opens with a new member
  useEffect(() => {
    if (isOpen) {
      setSessionSearch('');
      setSessionFilter('ALL');
    }
  }, [isOpen, member?.id]);

  // Defensive Enrichment: If member is missing records, eligibleSessions, or sessions list is empty,
  // dynamically fetch attendance sheet and admin analytics
  useEffect(() => {
    if (!isOpen || !member?.id) return;

    const needsEnrichment =
      !enrichedMember?.records ||
      enrichedMember?.eligibleSessions === undefined ||
      allSessions.length === 0;

    if (!needsEnrichment) return;

    let isMounted = true;
    setIsLoadingDetails(true);

    Promise.allSettled([api.getAttendanceSheet(), api.getAdminAnalytics()])
      .then(([sheetRes, analyticsRes]) => {
        if (!isMounted) return;

        const sheetData = sheetRes.status === 'fulfilled' ? sheetRes.value : null;
        const sheetSessions = sheetData?.sessions || [];
        const sheetMember = sheetData?.members?.find((m: any) => m.id === member.id);

        const analyticsData = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
        const analyticsMember = analyticsData?.memberAnalytics?.find((m: any) => m.id === member.id);

        setEnrichedMember((prev: any) => {
          const base = prev || member;
          const records = sheetMember?.records || base.records || {};

          // Compute onTime and late counts from records if needed
          let recOnTime = 0;
          let recLate = 0;
          let recAttended = 0;
          Object.values(records).forEach((st) => {
            if (st === 'present') {
              recOnTime++;
              recAttended++;
            } else if (st === 'late') {
              recLate++;
              recAttended++;
            }
          });

          return {
            ...base,
            name: analyticsMember?.name ?? sheetMember?.name ?? base.name,
            email: analyticsMember?.email ?? base.email,
            rollNumber: analyticsMember?.rollNumber ?? sheetMember?.rollNumber ?? base.rollNumber,
            academicYear: analyticsMember?.academicYear ?? sheetMember?.academicYear ?? base.academicYear,
            teamName: analyticsMember?.teamName ?? sheetMember?.teamName ?? base.teamName,
            teamCode: analyticsMember?.teamCode ?? sheetMember?.teamCode ?? base.teamCode,
            position: analyticsMember?.position ?? sheetMember?.position ?? base.position,
            role: analyticsMember?.role ?? sheetMember?.role ?? base.role,
            isExempt: analyticsMember?.isExempt ?? sheetMember?.isExempt ?? base.isExempt ?? (base.role === 'advisor'),
            avatarUrl: analyticsMember?.avatarUrl ?? sheetMember?.avatarUrl ?? base.avatarUrl,
            attendedSessions:
              analyticsMember?.attendedSessions ??
              sheetMember?.attended ??
              (recAttended > 0 ? recAttended : base.attendedSessions ?? base.totalAttended ?? 0),
            totalAttended:
              analyticsMember?.totalAttended ??
              sheetMember?.attended ??
              (recAttended > 0 ? recAttended : base.totalAttended ?? 0),
            eligibleSessions:
              analyticsMember?.eligibleSessions ??
              sheetMember?.eligibleSessions ??
              base.eligibleSessions ??
              0,
            attendancePercentage:
              analyticsMember?.attendancePercentage ??
              sheetMember?.attendanceRate ??
              base.attendancePercentage,
            onTimeCount:
              analyticsMember?.onTimeCount ??
              (recOnTime > 0 ? recOnTime : base.onTimeCount),
            lateCount:
              analyticsMember?.lateCount ??
              (recLate > 0 ? recLate : base.lateCount ?? 0),
            punctualityRate:
              analyticsMember?.punctualityRate ??
              base.punctualityRate,
            isAtRisk:
              analyticsMember?.isAtRisk ??
              base.isAtRisk,
            lastActive:
              analyticsMember?.lastActive ??
              base.lastActive,
            records,
          };
        });

        if (sheetSessions.length > 0) {
          setAllSessions(sheetSessions);
        }
      })
      .catch((err) => {
        console.error('Failed to load member analytics details:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, member?.id]);

  const active = enrichedMember || member || {};
  const isAdvisor = active.role === 'advisor' || active.isExempt;
  const academicYear = active.academicYear || (active.rollNumber ? getAcademicYear(active.rollNumber) : 'Other');

  // Compute Core Metrics
  const records: Record<string, string | null> = active.records || {};

  let recordOnTime = 0;
  let recordLate = 0;
  let recordAttended = 0;
  Object.values(records).forEach((st) => {
    if (st === 'present') {
      recordOnTime++;
      recordAttended++;
    } else if (st === 'late') {
      recordLate++;
      recordAttended++;
    }
  });

  const attended =
    active.attendedSessions ??
    active.totalAttended ??
    (recordAttended > 0 ? recordAttended : 0);

  const eligible =
    active.eligibleSessions ??
    (active.totalSessions !== undefined && !isAdvisor ? active.totalSessions : 0);

  const missed = Math.max(0, eligible - attended);

  const onTime =
    active.onTimeCount !== undefined
      ? active.onTimeCount
      : recordOnTime > 0
      ? recordOnTime
      : attended;

  const late =
    active.lateCount !== undefined
      ? active.lateCount
      : recordLate;

  const punctuality =
    active.punctualityRate !== undefined
      ? active.punctualityRate
      : attended > 0
      ? Math.round((onTime / attended) * 100)
      : 100;

  const rate = isAdvisor
    ? 100
    : active.attendancePercentage !== undefined
    ? active.attendancePercentage
    : eligible > 0
    ? Math.round((attended / eligible) * 100)
    : 100;

  const isAtRisk = !isAdvisor && (active.isAtRisk || (rate < 75 && eligible >= 2));

  // Determine individual session status and label
  const getSessionStatusInfo = (session: any) => {
    const rawStatus = records[session.id];

    if (isAdvisor) {
      if (rawStatus === 'present') {
        return {
          type: 'present' as const,
          label: 'Present (On-Time)',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: Check,
        };
      }
      if (rawStatus === 'late') {
        return {
          type: 'late' as const,
          label: 'Late Arrival',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: Clock3,
        };
      }
      return {
        type: 'exempt' as const,
        label: 'Advisor (Exempt)',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        icon: ShieldCheck,
      };
    }

    if (rawStatus === 'present') {
      return {
        type: 'present' as const,
        label: 'Present (On-Time)',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: Check,
      };
    }

    if (rawStatus === 'late') {
      return {
        type: 'late' as const,
        label: 'Late Arrival',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Clock3,
      };
    }

    if (rawStatus === 'not_in_club') {
      return {
        type: 'exempt' as const,
        label: 'Excused / Not in Club',
        badgeClass: 'bg-muted/80 text-muted-foreground border-border',
        icon: Minus,
      };
    }

    if (rawStatus === 'joined_later') {
      return {
        type: 'exempt' as const,
        label: 'Joined Club Later',
        badgeClass: 'bg-muted/80 text-muted-foreground border-border',
        icon: Calendar,
      };
    }

    if (rawStatus === 'not_in_year') {
      return {
        type: 'exempt' as const,
        label: 'Other Academic Year',
        badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        icon: GraduationCap,
      };
    }

    if (rawStatus === 'not_in_team') {
      return {
        type: 'exempt' as const,
        label: 'Other Wing Only',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: Building,
      };
    }

    if (rawStatus === 'not_a_head') {
      return {
        type: 'exempt' as const,
        label: 'Heads Only Meeting',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Crown,
      };
    }

    // If session predates user creation and no rawStatus
    if (active.createdAt && session.startTime && new Date(session.startTime) < new Date(active.createdAt)) {
      return {
        type: 'exempt' as const,
        label: 'Joined Club Later',
        badgeClass: 'bg-muted/80 text-muted-foreground border-border',
        icon: Calendar,
      };
    }

    return {
      type: 'absent' as const,
      label: 'Absent',
      badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
      icon: X,
    };
  };

  // Filtered Sessions List
  const sessionListWithStatus = useMemo(() => {
    return allSessions.map((s) => ({
      ...s,
      statusInfo: getSessionStatusInfo(s),
    }));
  }, [allSessions, records, isAdvisor, active.createdAt]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.toLowerCase().trim();
    return sessionListWithStatus.filter((s) => {
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.type && s.type.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (sessionFilter === 'ALL') return true;
      if (sessionFilter === 'ATTENDED') return s.statusInfo.type === 'present' || s.statusInfo.type === 'late';
      if (sessionFilter === 'LATE') return s.statusInfo.type === 'late';
      if (sessionFilter === 'ABSENT') return s.statusInfo.type === 'absent';
      if (sessionFilter === 'EXEMPT') return s.statusInfo.type === 'exempt';
      return true;
    });
  }, [sessionListWithStatus, sessionSearch, sessionFilter]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let pres = 0;
    let lt = 0;
    let abs = 0;
    let exm = 0;
    sessionListWithStatus.forEach((s) => {
      if (s.statusInfo.type === 'present') pres++;
      else if (s.statusInfo.type === 'late') lt++;
      else if (s.statusInfo.type === 'absent') abs++;
      else if (s.statusInfo.type === 'exempt') exm++;
    });
    return {
      all: sessionListWithStatus.length,
      attended: pres + lt,
      late: lt,
      absent: abs,
      exempt: exm,
    };
  }, [sessionListWithStatus]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-xl">
        {/* Sticky Header with Member Profile */}
        <div className="p-5 sm:p-6 bg-secondary/40 border-b border-border/80 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <MemberAvatar
                src={active.avatarUrl}
                name={active.name}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-border shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground truncate">{active.name}</h3>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-mono font-medium ${getYearBadgeColor(
                      academicYear as any
                    )}`}
                  >
                    {academicYear}
                  </span>
                  {active.role === 'admin' ? (
                    <Badge variant="default" className="text-[10px] h-5 gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </Badge>
                  ) : active.role === 'advisor' ? (
                    <Badge variant="warning" className="text-[10px] h-5 gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      Advisor
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                      <User className="w-2.5 h-2.5" />
                      Member
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span className="font-mono text-foreground font-medium">{active.rollNumber}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-muted-foreground truncate max-w-[220px]">
                    <Mail className="w-3 h-3 shrink-0" />
                    {active.email}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[11px] bg-background/50 border-border">
                    {active.teamName || 'General Wing'}
                  </Badge>
                  <span>•</span>
                  <span className="font-medium text-foreground">{active.position || 'Member'}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Status
              </span>
              <Badge
                variant="outline"
                className={`mt-1 text-xs font-semibold px-2.5 py-1 ${
                  isAdvisor
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                    : rate >= 75
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : rate >= 60
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                }`}
              >
                {isAdvisor
                  ? 'Exempt from Quorum'
                  : rate >= 75
                  ? 'Qualified (Safe)'
                  : rate >= 60
                  ? 'Warning Zone'
                  : 'Critical Deficit'}
              </Badge>
            </div>
          </div>

          {/* At-Risk Warning Notice */}
          {isAtRisk && (
            <div className="mt-3.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
              <div>
                <strong className="font-semibold">At-Risk Member Alert:</strong> Attendance is currently{' '}
                <span className="font-bold underline">{rate}%</span>, which is below the 75% university eligibility requirement.
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body: Metrics & Session Attendance History */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5 sm:p-6 space-y-6">
          {isLoadingDetails && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-secondary/50 text-xs text-muted-foreground border border-border">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Synchronizing latest attendance sheet and punctuality logs...</span>
            </div>
          )}

          {/* ── 1. Attendance & Punctuality KPI Cards (Identical to Team Analytics) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Overall Attendance Rate */}
            <Card className="p-4 bg-card border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Attendance Rate
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {rate}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({attended} of {eligible} eligible)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isAdvisor
                    ? 'Faculty advisors are exempt from check-in minimums'
                    : 'Target requirement: ≥75% attendance'}
                </div>
              </div>
            </Card>

            {/* Punctuality Rate */}
            <Card className="p-4 bg-card border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Punctuality Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {punctuality}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({onTime} on-time of {attended} attended)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {late > 0 ? `${late} late arrival${late > 1 ? 's' : ''} after session start` : 'Perfect on-time record'}
                </div>
              </div>
            </Card>
          </div>

          {/* ── 2. Detailed Counts 4-Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 bg-emerald-500/5 border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span>On-Time</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {onTime}
              </div>
              <p className="text-[10px] text-muted-foreground">Scanned before cutoff</p>
            </Card>

            <Card className="p-3 bg-amber-500/5 border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <span>Late Arrivals</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {late}
              </div>
              <p className="text-[10px] text-muted-foreground">&gt;15 mins after start</p>
            </Card>

            <Card className="p-3 bg-card border-border space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Eligible Sessions</span>
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">
                {eligible}
              </div>
              <p className="text-[10px] text-muted-foreground">Prorated for wing/year</p>
            </Card>

            <Card className="p-3 bg-destructive/5 border-destructive/20 space-y-1">
              <div className="flex items-center justify-between text-destructive text-xs font-semibold">
                <span>Missed / Absent</span>
                <XCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-bold text-destructive tabular-nums">
                {missed}
              </div>
              <p className="text-[10px] text-muted-foreground">Unattended eligible</p>
            </Card>
          </div>

          {/* ── 3. Session Attendance Breakdown (Attendance Sheet View) ── */}
          <div className="space-y-3.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Session Attendance History</h4>
                <Badge variant="secondary" className="text-[10px] font-mono font-medium">
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Filter sessions..."
                  className="h-8 text-xs pl-8 pr-2.5 bg-background border-border"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSessionFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  sessionFilter === 'ALL'
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                All ({tabCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('ATTENDED')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  sessionFilter === 'ATTENDED'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                Attended ({tabCounts.attended})
              </button>
              {tabCounts.late > 0 && (
                <button
                  type="button"
                  onClick={() => setSessionFilter('LATE')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                    sessionFilter === 'LATE'
                      ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  Late ({tabCounts.late})
                </button>
              )}
              <button
                type="button"
                onClick={() => setSessionFilter('ABSENT')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  sessionFilter === 'ABSENT'
                    ? 'bg-destructive text-destructive-foreground border-destructive font-semibold'
                    : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                }`}
              >
                Absent ({tabCounts.absent})
              </button>
              {tabCounts.exempt > 0 && (
                <button
                  type="button"
                  onClick={() => setSessionFilter('EXEMPT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                    sessionFilter === 'EXEMPT'
                      ? 'bg-muted-foreground text-background border-muted-foreground font-semibold'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  Exempt / Other ({tabCounts.exempt})
                </button>
              )}
            </div>

            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-secondary/10">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">No sessions match this filter</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Try changing the filter or clearing the search query.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
                {filteredSessions.map((session) => {
                  const StatusIcon = session.statusInfo.icon;
                  return (
                    <div
                      key={session.id}
                      className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {session.title}
                          </span>
                          {session.type && (
                            <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0 h-4 border-border">
                              {session.type}
                            </Badge>
                          )}
                          {session.yearsLabel && session.yearsLabel !== 'All Years' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {session.yearsLabel}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatDate(session.startTime)}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatTime(session.startTime)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex items-center justify-start sm:justify-end">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${session.statusInfo.badgeClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{session.statusInfo.label}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-secondary/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            {active.lastActive && (
              <span className="hidden sm:inline">
                Last Activity: <strong className="text-foreground">{formatDate(active.lastActive)}</strong>
              </span>
            )}
            <span className="font-mono text-[11px] text-muted-foreground">
              ID: {active.id.slice(0, 8)}...
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
