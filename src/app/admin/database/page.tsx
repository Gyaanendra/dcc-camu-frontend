'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { TableExplorer } from '@/components/database/TableExplorer';
import { Database, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDatabasePage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Database' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 w-full max-w-[99%] 2xl:max-w-none mx-auto space-y-6">
            <PageHeader
              icon={Database}
              crumbs={[{ label: 'Admin' }, { label: 'Database Explorer' }]}
              title="Database Explorer"
              description="Direct SQLite table manager — browse records, edit row values, and delete rows safely."
              actions={
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs gap-1.5 px-3 py-1 bg-muted/40 border-border/70"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Admin Mode</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  >
                    <Database className="h-3.5 w-3.5" />
                    <span>SQLite WAL</span>
                  </Badge>
                </div>
              }
            />

            <TableExplorer />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
