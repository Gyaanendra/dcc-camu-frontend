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
  ArrowUpRight,
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

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards Querying Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Members */}
        <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              Database
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {summary?.totalMembers || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">Total Club Members</div>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold flex items-center gap-0.5">
              <span>Rate</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {summary?.overallAttendanceRate || 0}%
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">Overall Attendance</div>
          </div>
        </div>

        {/* Card 3: Total Sessions */}
        <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-[10px] font-bold">
              Sessions
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {summary?.totalSessions || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">Recorded Meetings</div>
          </div>
        </div>

        {/* Card 4: Punctuality */}
        <div className="p-5 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
              Punctual
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
              {punctualityPercent}%
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">On-Time Arrival Ratio</div>
          </div>
        </div>
      </div>

      {/* Main Recharts Section with Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container */}
        <div className="lg:col-span-2 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Wing Attendance Performance</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Live attendance percentage grouped by assigned wing</p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl gap-1">
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  chartView === 'bar'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Wing Bars
              </button>
              <button
                onClick={() => setChartView('pie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  chartView === 'pie'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
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
                    <XAxis dataKey="code" stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} tickLine={false} />
                    <YAxis stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e2e8f0',
                        borderRadius: '10px',
                        color: isDark ? '#f4f4f5' : '#0f172a',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                      }}
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
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500">
                  <BarChart3 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">No Wing Data Recorded Yet</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                      borderRadius: '10px',
                      color: isDark ? '#f4f4f5' : '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500">
                <PieIcon className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">No Attendance Check-ins Yet</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Check-in distributions (On-time vs Late) will display once members scan session QR codes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Real Wing Standings Leaderboard */}
        <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Wing Standings
            </h3>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Rankings</span>
          </div>

          <div className="space-y-2.5">
            {sortedTeams.length > 0 ? (
              sortedTeams.map((team, idx) => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 hover:bg-slate-100/80 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{team.teamName}</div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-400">{team.memberCount} members</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">{team.attendanceRate}%</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                      {team.totalAttendanceCount} logs
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-xs">
                No club wings registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
