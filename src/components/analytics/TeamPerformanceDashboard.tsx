'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Trophy,
  Users,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  Search,
  ShieldCheck,
  Eye,
  Sparkles,
  Filter,
  TrendingUp,
  TrendingDown,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberAvatar } from '@/components/ui/member-avatar';
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { getAcademicYear, getYearBadgeColor, getYearShortBadge } from '@/lib/academic-year';
import { MemberAnalyticsModal } from '@/components/analytics/MemberAnalyticsModal';

interface TeamPerformanceDashboardProps {
  teamAnalytics: Array<{
    teamId: string;
    teamName: string;
    code: string;
    color: string;
    memberCount: number;
    totalPresent: number;
    totalLate: number;
    totalAttendanceCount?: number;
    attendanceRate: number;
  }>;
  memberAnalytics: Array<{
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    academicYear?: string;
    position: string;
    role: string;
    teamId: string | null;
    teamName: string;
    teamCode?: string;
    avatarUrl?: string;
    totalAttended: number;
    attendedSessions?: number;
    onTimeCount?: number;
    lateCount?: number;
    eligibleSessions?: number;
    attendancePercentage?: number;
    punctualityRate?: number;
    isAtRisk?: boolean;
    lastActive?: string;
    records?: Record<string, string | null>;
  }>;
  summary: {
    totalMembers: number;
    totalAdmins?: number;
    totalAdvisors?: number;
    totalUsers?: number;
    totalSessions: number;
    overallAttendanceRate: number;
    onTimeCount: number;
    lateCount: number;
  };
  sessions?: any[];
  isLoading?: boolean;
}

export const TeamPerformanceDashboard: React.FC<TeamPerformanceDashboardProps> = ({
  teamAnalytics = [],
  memberAnalytics = [],
  summary,
  sessions = [],
  isLoading = false,
}) => {
  // Active chart tab: attendance | punctuality | risk
  const [chartTab, setChartTab] = useState<'attendance' | 'punctuality' | 'risk'>('attendance');

  // Wing cards filtering & sorting
  const [wingSearch, setWingSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'QUALIFIED' | 'WARNING'>('ALL');
  const [sortBy, setSortBy] = useState<'RATE_DESC' | 'RATE_ASC' | 'MEMBERS' | 'PUNCTUALITY'>('RATE_DESC');

  // Selected wing for deep-dive inspection
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [memberSearchInWing, setMemberSearchInWing] = useState('');

  // Individual member analytics modal
  const [viewingMember, setViewingMember] = useState<any | null>(null);

  // Compute enriched team analytics with member metrics
  const enrichedTeams = useMemo(() => {
    return teamAnalytics.map((team) => {
      const wingMembers = memberAnalytics.filter((m) => m.teamId === team.teamId);
      const atRiskMembers = wingMembers.filter(
        (m) => m.isAtRisk || (m.attendancePercentage !== undefined && m.attendancePercentage < 75 && m.role !== 'advisor')
      );
      const safeMembers = wingMembers.filter(
        (m) => (m.attendancePercentage ?? 100) >= 75 && m.role !== 'advisor'
      );
      const warningMembers = wingMembers.filter(
        (m) => (m.attendancePercentage ?? 100) >= 60 && (m.attendancePercentage ?? 100) < 75 && m.role !== 'advisor'
      );
      const criticalMembers = wingMembers.filter(
        (m) => (m.attendancePercentage ?? 100) < 60 && m.role !== 'advisor'
      );

      const totalCheckIns = team.totalAttendanceCount ?? (team.totalPresent + team.totalLate);
      const punctualityRate = totalCheckIns > 0 ? Math.round((team.totalPresent / totalCheckIns) * 100) : 100;

      // Identify wing leads / heads
      const leads = wingMembers.filter((m) =>
        /(head|lead|coordinator|president|director|lead)/i.test(m.position || '')
      );

      return {
        ...team,
        totalCheckIns,
        punctualityRate,
        atRiskCount: atRiskMembers.length,
        safeCount: safeMembers.length,
        warningCount: warningMembers.length,
        criticalCount: criticalMembers.length,
        leads,
        members: wingMembers,
        isQualified: team.attendanceRate >= 75,
        isWarning: team.attendanceRate >= 60 && team.attendanceRate < 75,
        isCritical: team.attendanceRate < 60,
      };
    });
  }, [teamAnalytics, memberAnalytics]);

  // Overall ranked teams by attendance rate
  const rankedTeams = useMemo(() => {
    return [...enrichedTeams].sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [enrichedTeams]);

  // Top performing wing and punctuality champion
  const topWing = rankedTeams[0] || null;
  const punctualityLeader = useMemo(() => {
    return [...enrichedTeams].sort((a, b) => b.punctualityRate - a.punctualityRate)[0] || null;
  }, [enrichedTeams]);

  const atRiskWings = useMemo(() => {
    return enrichedTeams.filter((t) => t.attendanceRate < 75);
  }, [enrichedTeams]);

  // Filtered & sorted wings for scorecards
  const filteredWings = useMemo(() => {
    const q = wingSearch.toLowerCase().trim();
    const filtered = enrichedTeams.filter((t) => {
      const matchesSearch =
        !q ||
        t.teamName.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (healthFilter === 'QUALIFIED') return t.attendanceRate >= 75;
      if (healthFilter === 'WARNING') return t.attendanceRate < 75;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'RATE_DESC') return b.attendanceRate - a.attendanceRate;
      if (sortBy === 'RATE_ASC') return a.attendanceRate - b.attendanceRate;
      if (sortBy === 'MEMBERS') return b.memberCount - a.memberCount;
      if (sortBy === 'PUNCTUALITY') return b.punctualityRate - a.punctualityRate;
      return 0;
    });
  }, [enrichedTeams, wingSearch, healthFilter, sortBy]);

  // Selected wing details
  const activeWing = useMemo(() => {
    if (!selectedTeamId) return null;
    return enrichedTeams.find((t) => t.teamId === selectedTeamId) || null;
  }, [enrichedTeams, selectedTeamId]);

  // Members inside active wing
  const activeWingMembers = useMemo(() => {
    if (!activeWing) return [];
    const q = memberSearchInWing.toLowerCase().trim();
    return activeWing.members.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.rollNumber.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q))
      );
    });
  }, [activeWing, memberSearchInWing]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Executive Performance Command Bar ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Solid Brand Orange Highlight Card: Top Performing Wing */}
        <div className="card-highlight p-5 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-200" />
              Leading Wing
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold">
              Rank #1
            </span>
          </div>

          <div className="my-2.5">
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {topWing ? topWing.teamName : 'No data'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {topWing ? `${topWing.attendanceRate}%` : '0%'}
              </span>
              <span className="text-xs text-white/80">attendance</span>
            </div>
          </div>

          <div className="text-xs text-white/85 pt-2 border-t border-white/20 flex items-center justify-between font-mono">
            <span>{topWing ? `${topWing.memberCount} members` : '0 members'}</span>
            <span>{topWing ? `${topWing.punctualityRate}% on-time` : ''}</span>
          </div>
        </div>

        {/* Card 2: Club-Wide Attendance Quorum */}
        <Card className="p-5 rounded-2xl border-border bg-card flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Club Quorum
            </span>
            <Badge
              variant="outline"
              className={
                (summary?.overallAttendanceRate || 0) >= 75
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]'
              }
            >
              {(summary?.overallAttendanceRate || 0) >= 75 ? 'Target Met (≥75%)' : 'Deficit Alert'}
            </Badge>
          </div>

          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black text-foreground tabular-nums tracking-tight">
              {summary?.overallAttendanceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target requirement: ≥75% university eligibility
            </p>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between font-mono">
            <span>{summary?.totalMembers || 0} active members</span>
            <span>{summary?.totalSessions || 0} sessions</span>
          </div>
        </Card>

        {/* Card 3: Punctuality Champion */}
        <Card className="p-5 rounded-2xl border-border bg-card flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Punctuality Leader
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Discipline</span>
          </div>

          <div className="my-2.5">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
              {punctualityLeader ? punctualityLeader.teamName : 'No data'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-foreground tabular-nums">
                {punctualityLeader ? `${punctualityLeader.punctualityRate}%` : '0%'}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">on-time scans</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between font-mono">
            <span>{summary?.onTimeCount || 0} on-time total</span>
            <span>{summary?.lateCount || 0} late</span>
          </div>
        </Card>

        {/* Card 4: Wings Requiring Intervention */}
        <Card className="p-5 rounded-2xl border-border bg-card flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Quorum Deficits
            </span>
            <Badge
              variant="outline"
              className={
                atRiskWings.length === 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]'
                  : 'bg-destructive/10 text-destructive border-destructive/30 text-[10px]'
              }
            >
              {atRiskWings.length === 0 ? 'All Compliant' : `${atRiskWings.length} Need Action`}
            </Badge>
          </div>

          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black text-foreground tabular-nums tracking-tight">
              {atRiskWings.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {atRiskWings.length === 0
                ? 'All club wings are currently at or above 75%'
                : 'Wings currently falling below the 75% quorum threshold'}
            </p>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {atRiskWings.length > 0 ? atRiskWings.map((w) => w.code).join(', ') : 'Zero deficits'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── 2. Comparative Performance Analytics Charts ─────────── */}
      <Card className="p-5 rounded-2xl border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Wing Performance Comparison
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparative attendance percentage across club wings vs the 75% university eligibility requirement
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/50 shrink-0">
            <button
              type="button"
              onClick={() => setChartTab('attendance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                chartTab === 'attendance'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Attendance %
            </button>
            <button
              type="button"
              onClick={() => setChartTab('punctuality')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                chartTab === 'punctuality'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Punctuality Ratio
            </button>
            <button
              type="button"
              onClick={() => setChartTab('risk')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                chartTab === 'risk'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              At-Risk Distribution
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {enrichedTeams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Building className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs font-medium">No club wings found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'attendance' ? (
                <BarChart data={rankedTeams} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="code"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover/95 border border-border backdrop-blur-md p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <div className="font-bold text-foreground">{data.teamName}</div>
                          <div className="text-muted-foreground">
                            Attendance Rate:{' '}
                            <strong className="text-foreground">{data.attendanceRate}%</strong>
                          </div>
                          <div className="text-muted-foreground">
                            Active Members: <strong className="text-foreground">{data.memberCount}</strong>
                          </div>
                          <div className="text-muted-foreground">
                            Total Logs:{' '}
                            <strong className="text-foreground">{data.totalCheckIns}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* 75% Benchmark Target Line */}
                  <ReferenceLine
                    y={75}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    label={{
                      value: '75% Target',
                      position: 'insideTopRight',
                      fill: 'hsl(var(--primary))',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="attendanceRate" name="Attendance %" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {rankedTeams.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? 'hsl(var(--primary))'
                            : entry.attendanceRate >= 75
                            ? '#10b981'
                            : entry.attendanceRate >= 60
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartTab === 'punctuality' ? (
                <BarChart data={enrichedTeams} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="code"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover/95 border border-border backdrop-blur-md p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <div className="font-bold text-foreground">{data.teamName}</div>
                          <div className="text-muted-foreground">
                            Punctuality Rate:{' '}
                            <strong className="text-emerald-500">{data.punctualityRate}%</strong>
                          </div>
                          <div className="text-muted-foreground">
                            On-Time Scans: <strong className="text-foreground">{data.totalPresent}</strong>
                          </div>
                          <div className="text-muted-foreground">
                            Late Arrivals: <strong className="text-amber-500">{data.totalLate}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="punctualityRate" name="Punctuality %" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {enrichedTeams.map((entry, index) => (
                      <Cell key={`punct-${index}`} fill="#10b981" />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={enrichedTeams} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="code"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover/95 border border-border backdrop-blur-md p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <div className="font-bold text-foreground">{data.teamName}</div>
                          <div className="text-destructive font-medium">
                            At-Risk Members: <strong>{data.atRiskCount}</strong> of {data.memberCount}
                          </div>
                          <div className="text-muted-foreground">
                            Below 75% attendance minimum
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="atRiskCount" name="At-Risk Members" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {enrichedTeams.map((entry, index) => (
                      <Cell
                        key={`risk-${index}`}
                        fill={entry.atRiskCount > 0 ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* ── 3. Wing Performance Scorecard Grid ───────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Club Wing Standings &amp; Scorecards
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any wing card to inspect its members, attendance distribution, and leadership
            </p>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={wingSearch}
                onChange={(e) => setWingSearch(e.target.value)}
                placeholder="Search wings..."
                className="h-8 text-xs pl-8 pr-2.5 bg-background border-border"
              />
            </div>

            <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/50 text-xs">
              <button
                type="button"
                onClick={() => setHealthFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  healthFilter === 'ALL'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({enrichedTeams.length})
              </button>
              <button
                type="button"
                onClick={() => setHealthFilter('QUALIFIED')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  healthFilter === 'QUALIFIED'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ≥75%
              </button>
              <button
                type="button"
                onClick={() => setHealthFilter('WARNING')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  healthFilter === 'WARNING'
                    ? 'bg-destructive text-destructive-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                &lt;75%
              </button>
            </div>
          </div>
        </div>

        {/* Wing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWings.map((team, idx) => {
            const isSelected = selectedTeamId === team.teamId;
            const rank = rankedTeams.findIndex((t) => t.teamId === team.teamId) + 1;

            return (
              <Card
                key={team.teamId}
                onClick={() => setSelectedTeamId(isSelected ? null : team.teamId)}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                {/* Header: Rank + Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank === 1
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-xs'
                          : rank === 2
                          ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                          : rank === 3
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}
                    >
                      #{rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{team.teamName}</h4>
                      <span className="font-mono text-[11px] text-muted-foreground">{team.code}</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 font-medium ${
                      team.attendanceRate >= 75
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : team.attendanceRate >= 60
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30'
                    }`}
                  >
                    {team.attendanceRate >= 75 ? 'Qualified' : team.attendanceRate >= 60 ? 'Warning' : 'Deficit'}
                  </Badge>
                </div>

                {/* Big Attendance Metric + Progress Gauge */}
                <div className="my-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                        {team.attendanceRate}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5 font-normal">attendance</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Target: 75%
                    </span>
                  </div>

                  {/* Progress Bar with 75% Benchmark Notch */}
                  <div className="relative w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        team.attendanceRate >= 75
                          ? 'bg-emerald-500'
                          : team.attendanceRate >= 60
                          ? 'bg-amber-500'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${Math.min(100, team.attendanceRate)}%` }}
                    />
                  </div>
                </div>

                {/* 4 Mini Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs">
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Members</span>
                    <div className="font-bold text-foreground text-sm tabular-nums mt-0.5">{team.memberCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Punctuality</span>
                    <div className="font-bold text-emerald-500 text-sm tabular-nums mt-0.5">{team.punctualityRate}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">At-Risk (&lt;75%)</span>
                    <div
                      className={`font-bold text-sm tabular-nums mt-0.5 ${
                        team.atRiskCount > 0 ? 'text-destructive' : 'text-emerald-500'
                      }`}
                    >
                      {team.atRiskCount}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Check-ins</span>
                    <div className="font-bold text-foreground text-sm tabular-nums mt-0.5">{team.totalCheckIns}</div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px]">
                    {isSelected ? 'Click to close dossier' : 'Click to inspect roster'}
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── 4. Deep-Dive Wing Inspector (Selected Team Roster & Profile) ── */}
      {activeWing && (
        <Card className="p-6 rounded-2xl border-primary/40 bg-card shadow-lg scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20">
                  {activeWing.code}
                </span>
                <h3 className="text-xl font-bold text-foreground">{activeWing.teamName} Roster</h3>
                <Badge
                  variant="outline"
                  className={
                    activeWing.attendanceRate >= 75
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  }
                >
                  {activeWing.attendanceRate}% Attendance Rate
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing all {activeWing.members.length} members assigned to {activeWing.teamName}. Click any member to view their complete analytics and session check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearchInWing}
                  onChange={(e) => setMemberSearchInWing(e.target.value)}
                  placeholder="Filter wing members..."
                  className="h-8 text-xs pl-8 pr-2.5 bg-background border-border"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTeamId(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>

          {/* Member Roster Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <TableHeader className="bg-secondary/40 border-b border-border text-xs text-muted-foreground">
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Roll &amp; Email</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>On-Time / Late</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeWingMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      No members match the search in this wing.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeWingMembers.map((member) => {
                    const yr = member.academicYear || getAcademicYear(member.rollNumber);
                    const rate = member.attendancePercentage ?? 100;
                    const isAtRisk = member.isAtRisk || (rate < 75 && member.role !== 'advisor');

                    return (
                      <TableRow
                        key={member.id}
                        className="group hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => setViewingMember(member)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar
                              src={member.avatarUrl}
                              name={member.name}
                              className="h-8 w-8 border border-border shrink-0"
                            />
                            <div className="font-semibold text-foreground text-xs">{member.name}</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono text-xs text-foreground font-medium">{member.rollNumber}</div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {member.email}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${getYearBadgeColor(
                              yr as any
                            )}`}
                          >
                            {yr}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {member.position || 'Member'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-baseline gap-1.5 font-bold tabular-nums text-foreground">
                            <span>{rate}%</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              ({member.attendedSessions ?? member.totalAttended ?? 0}/{member.eligibleSessions ?? 0})
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs space-y-0.5 font-mono">
                            <span className="text-emerald-500 font-semibold">{member.onTimeCount ?? 0} on-time</span>
                            {member.lateCount !== undefined && member.lateCount > 0 && (
                              <span className="text-amber-500 ml-1.5">· {member.lateCount} late</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              member.role === 'advisor'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : !isAtRisk
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-destructive/10 text-destructive border-destructive/30'
                            }`}
                          >
                            {member.role === 'advisor' ? 'Exempt' : !isAtRisk ? 'Qualified' : 'At-Risk'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingMember(member);
                            }}
                            title="View Member Analytics"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      )}

      {/* Individual Member Analytics Modal */}
      {viewingMember && (
        <MemberAnalyticsModal
          member={viewingMember}
          sessions={sessions}
          isOpen={!!viewingMember}
          onClose={() => setViewingMember(null)}
        />
      )}
    </div>
  );
};
