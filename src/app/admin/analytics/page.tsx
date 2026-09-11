'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { api } from '@/lib/api';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Analytics' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
            <PageHeader
              icon={BarChart3}
              title="Team & member analytics"
              description="Live data queried from the club database."
              crumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}
              actions={
                <>
                  <Button
                    variant="secondary"
                    onClick={handleExportCSV}
                  >
                    <Download className="w-4 h-4 text-muted-foreground" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadData}
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              }
            />

            <TeamAnalyticsCharts
              teamAnalytics={data?.teamAnalytics || []}
              summary={data?.summary || { totalMembers: 0, totalSessions: 0, overallAttendanceRate: 0, onTimeCount: 0, lateCount: 0 }}
              isLoading={isLoading}
            />

            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-foreground">Member directory & performance</h2>
              <MemberDirectoryTable members={users} teams={teams} onRefresh={loadData} isLoading={isLoading} />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
