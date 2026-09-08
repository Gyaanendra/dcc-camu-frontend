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
  Tooltip,
  ResponsiveContainer,
  Legend,
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
import { useTheme } from '@/context/ThemeContext';

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

// KPI card — matches the dashboard member-view stat cards
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  iconClass: string;
  valueClass?: string;
}> = ({ label, value, sub, icon, iconClass, valueClass = 'text-foreground' }) => (
  <div className="dash-card p-5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className={iconClass}>{icon}</span>
    </div>
    <div className={`text-2xl font-bold mt-2 tabular-nums tracking-tight ${valueClass}`}>
      {value}
    </div>
    <div className="text-[11px] text-muted-foreground mt-1.5">{sub}</div>
  </div>
);

export const TeamAnalyticsCharts: React.FC<TeamAnalyticsProps> = ({ teamAnalytics = [], summary }) => {
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sortedTeams = [...teamAnalytics].sort((a, b) => b.attendanceRate - a.attendanceRate);

  const onTime = summary?.onTimeCount || 0;
  const late = summary?.lateCount || 0;
  const totalLogs = onTime + late;
  const punctualityPercent = totalLogs > 0 ? Math.round((onTime / totalLogs) * 100) : 0;

  const pieData = [
    { name: 'On-Time Check-ins', value: onTime, color: '#10b981' },
    { name: 'Late Arrivals', value: late, color: '#f59e0b' },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#111114' : '#ffffff',
    borderColor: isDark ? '#27272a' : '#e2e8f0',
    borderRadius: '10px',
    color: isDark ? '#fafafa' : '#181d26',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards Querying Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={summary?.totalMembers || 0}
          sub="Registered in the club"
          icon={<Users className="w-4 h-4" />}
          iconClass="text-accent"
        />
        <StatCard
          label="Attendance Rate"
          value={`${summary?.overallAttendanceRate || 0}%`}
          sub="Across all sessions"
          icon={<TrendingUp className="w-4 h-4" />}
          iconClass="text-accent"
        />
        <StatCard
          label="Sessions Held"
          value={summary?.totalSessions || 0}
          sub="Recorded meetings"
          icon={<Clock className="w-4 h-4" />}
          iconClass="text-accent"
        />
        <StatCard
          label="Punctuality"
          value={`${punctualityPercent}%`}
          sub="On-time arrival ratio"
          icon={<Award className="w-4 h-4" />}
          iconClass="text-accent"
        />
      </div>

      {/* Main Recharts Section with Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <div className="lg:col-span-2 dash-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Wing Attendance Performance</h3>
              <p className="text-xs text-muted-foreground">Attendance percentage grouped by assigned wing</p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-secondary rounded-xl gap-1">
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  chartView === 'bar'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Wing Bars
              </button>
              <button
                onClick={() => setChartView('pie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  chartView === 'pie'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" /> Punctuality Donut
              </button>
            </div>
          </div>

          {/* Recharts Canvas with Real Database Records */}
          <div className="h-72 w-full pt-3">
            {chartView === 'bar' ? (
              teamAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="code" stroke={isDark ? '#a1a1aa' : '#6b7280'} fontSize={11} tickLine={false} />
                    <YAxis stroke={isDark ? '#a1a1aa' : '#6b7280'} fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any) => [`${value}% Attendance Rate`, 'Attendance']}
                    />
                    <Bar dataKey="attendanceRate" name="Attendance %" radius={[6, 6, 0, 0]}>
                      {teamAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || (isDark ? '#e4e4e7' : '#181d26')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-foreground">No Wing Data Recorded Yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Create club wings and record member attendance to visualize live performance.
                  </p>
                </div>
              )
            ) : totalLogs > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <PieIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">No Attendance Check-ins Yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Check-in distributions (On-time vs Late) will display once members scan session QR codes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Real Wing Standings Leaderboard */}
        <div className="dash-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Wing Standings
            </h3>
            <span className="text-xs text-muted-foreground font-medium">Rankings</span>
          </div>

          <div className="space-y-2.5">
            {sortedTeams.length > 0 ? (
              sortedTeams.map((team, idx) => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
                        idx === 0
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : idx === 1
                          ? 'bg-secondary text-foreground border border-border'
                          : 'bg-transparent text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{team.teamName}</div>
                      <div className="text-[11px] text-muted-foreground">{team.memberCount} members</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground tabular-nums">{team.attendanceRate}%</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {team.totalAttendanceCount ?? (team.totalPresent + team.totalLate)} logs
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No club wings registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
