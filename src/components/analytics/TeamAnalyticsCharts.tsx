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
  TrendingUp,
  Users,
  Clock,
  Award,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    totalSessions: number;
    overallAttendanceRate: number;
    onTimeCount: number;
    lateCount: number;
  };
}

// KPI card — shadcn Card, hairline-only depth, tabular metrics
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, icon }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-accent">{icon}</span>
    </div>
    <div className="text-2xl font-semibold mt-2 tabular-nums tracking-tight text-foreground">
      {value}
    </div>
    <div className="text-xs text-muted-foreground mt-1.5">{sub}</div>
  </Card>
);

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

export const TeamAnalyticsCharts: React.FC<TeamAnalyticsProps> = ({ teamAnalytics = [], summary }) => {
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');

  const sortedTeams = [...teamAnalytics].sort((a, b) => b.attendanceRate - a.attendanceRate);

  const onTime = summary?.onTimeCount || 0;
  const late = summary?.lateCount || 0;
  const totalLogs = onTime + late;
  const punctualityPercent = totalLogs > 0 ? Math.round((onTime / totalLogs) * 100) : 0;

  const pieData = [
    { name: 'On-Time Check-ins', key: 'onTime', value: onTime, fill: 'var(--color-onTime)' },
    { name: 'Late Arrivals', key: 'late', value: late, fill: 'var(--color-late)' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards Querying Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={summary?.totalMembers || 0}
          sub="Registered in the club"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Attendance Rate"
          value={`${summary?.overallAttendanceRate || 0}%`}
          sub="Across all sessions"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Sessions Held"
          value={summary?.totalSessions || 0}
          sub="Recorded meetings"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Punctuality"
          value={`${punctualityPercent}%`}
          sub="On-time arrival ratio"
          icon={<Award className="w-4 h-4" />}
        />
      </div>

      {/* Main Charts Section with Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border space-y-0">
            <div>
              <CardTitle className="text-base">Wing Attendance Performance</CardTitle>
              <CardDescription>Attendance percentage grouped by assigned wing</CardDescription>
            </div>

            <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'bar' | 'pie')}>
              <TabsList>
                <TabsTrigger value="bar">
                  <BarChart3 className="w-3.5 h-3.5" /> Wing Bars
                </TabsTrigger>
                <TabsTrigger value="pie">
                  <PieIcon className="w-3.5 h-3.5" /> Punctuality Donut
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-3">
            <div className="h-72 w-full">
              {chartView === 'bar' ? (
                teamAnalytics.length > 0 ? (
                  <ChartContainer config={barConfig} className="h-full w-full">
                    <BarChart data={teamAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="code" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={11} />
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(value) => `${value}% Attendance Rate`} />}
                      />
                      <Bar dataKey="attendanceRate" name="Attendance %" radius={[6, 6, 0, 0]}>
                        {teamAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-attendanceRate)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">No Wing Data Recorded Yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create club wings and record member attendance to visualize live performance.
                    </p>
                  </div>
                )
              ) : totalLogs > 0 ? (
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
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <PieIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-foreground">No Attendance Check-ins Yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Check-in distributions (On-time vs Late) will display once members scan session QR codes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real Wing Standings Leaderboard */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Wing Standings
            </CardTitle>
            <span className="text-sm text-muted-foreground font-medium">Rankings</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2.5">
              {sortedTeams.length > 0 ? (
                sortedTeams.map((team, idx) => (
                  <div
                    key={team.teamId}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold tabular-nums ${
                          idx === 0
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : idx === 1
                            ? 'bg-card text-foreground border border-border'
                            : 'bg-transparent text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{team.teamName}</div>
                        <div className="text-xs text-muted-foreground">{team.memberCount} members</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground tabular-nums">{team.attendanceRate}%</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {team.totalAttendanceCount ?? (team.totalPresent + team.totalLate)} logs
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No club wings registered yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
