'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Executive Insights
                </div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Team & Member Analytics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Live data queried from Neon PostgreSQL database</p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4 text-muted-foreground" /> Export CSV Report
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadData}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </Card>

            {isLoading ? (
              <PageLoader message="Loading team & member analytics..." />
            ) : (
              <>
                {data && (
                  <TeamAnalyticsCharts
                    teamAnalytics={data.teamAnalytics || []}
                    summary={data.summary || { totalMembers: 0, totalSessions: 0, overallAttendanceRate: 0, onTimeCount: 0, lateCount: 0 }}
                  />
                )}

                <div className="space-y-3 pt-2">
                  <h2 className="text-sm font-bold text-foreground">Member Directory & Performance</h2>
                  <MemberDirectoryTable members={users} teams={teams} onRefresh={loadData} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
