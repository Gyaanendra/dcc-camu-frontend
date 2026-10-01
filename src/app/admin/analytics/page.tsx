'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { TeamAnalyticsCharts } from '@/components/analytics/TeamAnalyticsCharts';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { api } from '@/lib/api';
import { Download, RefreshCw, BarChart3, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  
  // Independent loading & error states for fast progressive loading
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const loadData = async () => {
    setIsAnalyticsLoading(true);
    setIsTeamsLoading(true);
    setIsUsersLoading(true);
    setAnalyticsError(null);

    // 1. Fetch team & member analytics engine
    api.getAdminAnalytics()
      .then((res) => {
        setData(res);
      })
      .catch((error: any) => {
        setAnalyticsError(error.message || 'Failed to compute team analytics');
        toast.error('Failed to load analytics: ' + error.message);
      })
      .finally(() => {
        setIsAnalyticsLoading(false);
      });

    // 2. Fetch club teams
    api.getTeams()
      .then((res) => {
        setTeams(res.teams || []);
      })
      .catch((err) => {
        console.error('Teams load error:', err);
      })
      .finally(() => {
        setIsTeamsLoading(false);
      });

    // 3. Fetch user directory
    api.getUsers()
      .then((res) => {
        setUsers(res.users || []);
      })
      .catch((err) => {
        console.error('Users load error:', err);
      })
      .finally(() => {
        setIsUsersLoading(false);
      });

    // 4. Fetch attendance sheet for session details
    api.getAttendanceSheet()
      .then((res) => {
        setSessions(res.sessions || []);
      })
      .catch((err) => {
        console.error('Sheet sessions load error:', err);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Merge computed analytics members with user profiles
  const directoryMembers = useMemo(() => {
    if (data?.memberAnalytics && Array.isArray(data.memberAnalytics) && data.memberAnalytics.length > 0) {
      return data.memberAnalytics;
    }
    return users;
  }, [data?.memberAnalytics, users]);

  const isGlobalLoading = isAnalyticsLoading && isTeamsLoading && isUsersLoading;

  const handleExportCSV = () => {
    const list = directoryMembers.length > 0 ? directoryMembers : users;
    if (!list.length) return;

    const headers = [
      'Name',
      'Email',
      'Roll Number',
      'Academic Year',
      'Position',
      'Wing',
      'Role',
      'Attended Sessions',
      'Eligible Sessions',
      'Attendance %',
      'On-Time Check-ins',
      'Late Check-ins',
      'Punctuality %',
      'At Risk (<75%)',
    ];

    const rows = list.map((u: any) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.rollNumber}"`,
      `"${u.academicYear || ''}"`,
      `"${u.position || 'Member'}"`,
      `"${u.teamName}"`,
      `"${u.role}"`,
      u.attendedSessions ?? u.totalAttended ?? 0,
      u.eligibleSessions ?? 'N/A',
      u.attendancePercentage !== undefined ? `${u.attendancePercentage}%` : 'N/A',
      u.onTimeCount ?? 'N/A',
      u.lateCount ?? 0,
      u.punctualityRate !== undefined ? `${u.punctualityRate}%` : 'N/A',
      u.isAtRisk ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCC_Comprehensive_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Comprehensive attendance CSV report downloaded');
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Analytics' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
            <PageHeader
              icon={BarChart3}
              title="Team & Member Analytics"
              description="Live performance, punctuality, and individual member insights calculated from club sessions"
              crumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleExportCSV} className="text-xs h-9 gap-1.5">
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Export CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadData}
                    title="Refresh Live Data"
                    className="h-9 w-9"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGlobalLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              }
            />

            {/* Error Banner with Retry */}
            {analyticsError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analyticsError}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadData}
                  className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Charts Section */}
            <TeamAnalyticsCharts
              teamAnalytics={data?.teamAnalytics || []}
              summary={
                data?.summary || {
                  totalMembers: 0,
                  totalSessions: 0,
                  overallAttendanceRate: 0,
                  onTimeCount: 0,
                  lateCount: 0,
                }
              }
              isLoading={isAnalyticsLoading}
            />

            {/* In-depth Member Directory & Performance Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Member Performance & Directory
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Includes individual attendance %, late arrivals, and at-risk monitoring. Click Eye icon to view detailed metrics.
                  </p>
                </div>
              </div>

              <MemberDirectoryTable
                members={directoryMembers}
                teams={teams}
                sessions={sessions}
                onRefresh={loadData}
                isLoading={isUsersLoading && !data?.memberAnalytics}
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
