'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { CreateTeamModal } from '@/components/members/CreateTeamModal';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminMembersPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'advisor';
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([api.getUsers(), api.getTeams()]);
      setUsers(usersRes.users || []);
      setTeams(teamsRes.teams || []);
    } catch (e: any) {
      toast.error('Failed to load member directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
                  Club Membership
                </div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Member Directory
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{isReadOnly ? 'View-only access — editing is disabled for advisors' : 'Manage member assignments, positions, roles, and view attendance totals'}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <AddMemberModal teams={teams} onCreated={loadData} />
                <CreateTeamModal onCreated={loadData} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadData}
                  title="Refresh directory"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </Card>

            {isLoading ? (
              <PageLoader message="Loading member directory..." />
            ) : (
              <MemberDirectoryTable members={users} teams={teams} onRefresh={loadData} />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
