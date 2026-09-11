'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { CreateTeamModal } from '@/components/members/CreateTeamModal';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Members' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Club membership
                </div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Member Directory
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isReadOnly
                    ? 'View-only access — editing is disabled for advisors'
                    : 'Manage member assignments, positions, roles, and view attendance totals'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <Badge variant="outline" className="text-xs font-medium">
                    {users.length} Total People
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium text-accent bg-accent/10 border-accent/20">
                    {users.filter((u) => u.role === 'user').length} Members
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium text-accent bg-accent/10 border-accent/20">
                    {users.filter((u) => u.role === 'admin').length} Admins
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                    {users.filter((u) => u.role === 'advisor').length} Advisors
                  </Badge>
                </div>
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

            <MemberDirectoryTable members={users} teams={teams} onRefresh={loadData} isLoading={isLoading} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
