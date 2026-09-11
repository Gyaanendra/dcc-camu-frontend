'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Trophy,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface TeamAnalyticsProps {
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
  isLoading?: boolean;
}

const barConfig = {
  attendanceRate: {
    label: 'Attendance %',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const pieConfig = {
  onTime: {
    label: 'On-Time Check-ins',
    color: '#1f8a65',
  },
  late: {
    label: 'Late Arrivals',
    color: '#b45309',
  },
} satisfies ChartConfig;

export const TeamAnalyticsCharts: React.FC<TeamAnalyticsProps> = ({ teamAnalytics = [], summary, isLoading = false }) => {
  const [chartView, setChartView] = useState<'overview' | 'wings' | 'punctuality'>('overview');

  const sortedTeams = [...teamAnalytics].sort((a, b) => b.attendanceRate - a.attendanceRate);
  const topTeamId = sortedTeams[0]?.teamId;

  const onTime = summary?.onTimeCount || 0;
  const late = summary?.lateCount || 0;
  const totalLogs = onTime + late;
  const punctualityPercent = totalLogs > 0 ? Math.round((onTime / totalLogs) * 100) : 0;

  const pieData = [
    { name: 'On-Time Check-ins', key: 'onTime', value: onTime, fill: 'var(--color-onTime)' },
    { name: 'Late Arrivals', key: 'late', value: late, fill: 'var(--color-late)' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading analytics">
        <Card className="px-5 py-4 flex gap-6">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const barData = chartView === 'wings' ? sortedTeams : teamAnalytics;

  const barChart = barData.length > 0 ? (
    <ChartContainer config={barConfig} className="h-full w-full">
      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="code" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelClassName="font-mono text-xs"
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Attendance %</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{value}%</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="attendanceRate" name="Attendance %" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {barData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.teamId === topTeamId ? 'hsl(var(--primary))' : (entry.color || 'var(--color-attendanceRate)')}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  ) : (
    <EmptyState
      icon={BarChart3}
      title="No wing data yet"
      description="Create club wings and record member attendance to visualize live performance."
      className="h-full border-0"
    />
  );

  const donutChart = totalLogs > 0 ? (
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <ChartContainer config={pieConfig} className="h-full w-full">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent labelClassName="font-mono text-xs" />} />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-semibold tabular-nums text-foreground">{totalLogs}</span>
          <span className="text-xs text-muted-foreground">check-ins</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#1f8a65' }} />
          On-time
          <span className="font-mono tabular-nums text-foreground">{onTime}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#b45309' }} />
          Late
          <span className="font-mono tabular-nums text-foreground">{late}</span>
        </span>
      </div>
    </div>
  ) : (
    <EmptyState
      icon={PieIcon}
      title="No check-ins yet"
      description="On-time vs late distribution will display once members scan session QR codes."
      className="h-full border-0"
    />
  );

  return (
    <div className="space-y-4">
      {/* Quiet stat list */}
      <Card className="px-5 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-border">
        <div className="lg:pr-6">
          <div className="text-xs text-muted-foreground">Total roster</div>
          <div className="text-[20px] font-semibold tabular-nums text-foreground mt-0.5">
            {summary?.totalUsers ?? summary?.totalMembers ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {summary?.totalMembers ?? 0} members · {summary?.totalAdmins ?? 0} admins · {summary?.totalAdvisors ?? 0} advisors
          </div>
        </div>
        <div className="lg:px-6">
          <div className="text-xs text-muted-foreground">Attendance rate</div>
          <div className="text-[20px] font-semibold tabular-nums text-foreground mt-0.5">
            {summary?.overallAttendanceRate || 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">across all sessions</div>
        </div>
        <div className="lg:px-6">
          <div className="text-xs text-muted-foreground">Sessions held</div>
          <div className="text-[20px] font-semibold tabular-nums text-foreground mt-0.5">
            {summary?.totalSessions || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">recorded meetings</div>
        </div>
        <div className="lg:pl-6">
          <div className="text-xs text-muted-foreground">Punctuality</div>
          <div className="text-[20px] font-semibold tabular-nums text-foreground mt-0.5">
            {punctualityPercent}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">on-time arrival ratio</div>
        </div>
      </Card>

      {/* Charts with view tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={chartView === 'overview' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border space-y-0">
            <div>
              <CardTitle className="text-sm">Wing attendance performance</CardTitle>
              <CardDescription className="text-xs">Attendance percentage grouped by assigned wing</CardDescription>
            </div>

            <Tabs value={chartView} onValueChange={(v) => setChartView(v as typeof chartView)}>
              <TabsList>
                <TabsTrigger value="overview">
                  <BarChart3 className="w-3.5 h-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="wings">
                  <Trophy className="w-3.5 h-3.5" /> Wings
                </TabsTrigger>
                <TabsTrigger value="punctuality">
                  <PieIcon className="w-3.5 h-3.5" /> Punctuality
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-3">
            <div className="h-72 w-full">
              {chartView === 'punctuality' ? donutChart : barChart}
            </div>
          </CardContent>
        </Card>

        {/* Wing standings ranked list */}
        {chartView === 'overview' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border space-y-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" /> Wing standings
              </CardTitle>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {sortedTeams.length} wings
              </span>
            </CardHeader>
            <CardContent className="pt-3">
              {sortedTeams.length > 0 ? (
                <div>
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={team.teamId}
                      className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-5 text-center text-[13px] font-semibold tabular-nums text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{team.teamName}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">{team.memberCount} members</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-foreground tabular-nums">{team.attendanceRate}%</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {team.totalAttendanceCount ?? (team.totalPresent + team.totalLate)} logs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Trophy}
                  title="No wings yet"
                  description="Register club wings to see ranked standings."
                  className="border-0"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
