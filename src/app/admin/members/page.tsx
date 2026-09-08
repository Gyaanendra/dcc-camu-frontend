'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { CreateTeamModal } from '@/components/members/CreateTeamModal';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMembersPage() {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 dash-card">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Club Membership
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Member Directory
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Manage member assignments, positions, roles, and view attendance totals</p>
              </div>

              <div className="flex items-center gap-2.5">
                <AddMemberModal teams={teams} onCreated={loadData} />
                <CreateTeamModal onCreated={loadData} />
                <button
                  onClick={loadData}
                  className="p-2.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
                  title="Refresh directory"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

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
