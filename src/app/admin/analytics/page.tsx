'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { api } from '@/lib/api';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, teamsRes, usersRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getTeams(),
        api.getUsers(),
      ]);

      setData(analyticsRes);
      setTeams(teamsRes.teams || []);
      setUsers(usersRes.users || []);
    } catch (error: any) {
      toast.error('Failed to load analytics: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (!users.length) return;

    const headers = ['Name', 'Email', 'Roll Number', 'Position', 'Wing', 'Role', 'Attended Sessions'];
    const rows = users.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.rollNumber}"`,
      `"${u.position || 'Member'}"`,
      `"${u.teamName}"`,
      `"${u.role}"`,
      u.totalAttended,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCC_Attendance_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV report downloaded');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Executive Insights
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Team & Member Analytics
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Live data queried from Neon PostgreSQL database</p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-zinc-400" /> Export CSV Report
              </button>
              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {data && (
            <TeamAnalyticsCharts
              teamAnalytics={data.teamAnalytics || []}
              summary={data.summary || { totalMembers: 0, totalSessions: 0, overallAttendanceRate: 0, onTimeCount: 0, lateCount: 0 }}
            />
          )}

          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Member Directory & Performance</h2>
            <MemberDirectoryTable members={users} teams={teams} onRefresh={loadData} />
          </div>
        </main>
      </div>
    </div>
  );
}
