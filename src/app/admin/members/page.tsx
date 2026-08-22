'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MemberDirectoryTable } from '@/components/members/MemberDirectoryTable';
import { PageLoader } from '@/components/layout/PageLoader';
import { api } from '@/lib/api';
import { Users, RefreshCw } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Club Membership
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Member Directory
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage member assignments, positions, roles, and view attendance totals</p>
              </div>

              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
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
