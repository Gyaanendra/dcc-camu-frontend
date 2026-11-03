'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { TableExplorer } from '@/components/database/TableExplorer';
import { ShieldAlert, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AdminDatabasePage() {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isLoading && !isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Database Explorer"
          description="Direct SQLite database table manager."
        />
        <Card className="p-8 text-center space-y-3 max-w-md mx-auto border-destructive/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold">Access Restricted</h2>
          <p className="text-xs text-muted-foreground">
            Only club administrators have permission to browse, edit, or delete database records directly.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Database Explorer"
        description="Browse tables, search records, modify values, and delete rows directly in SQLite."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 font-mono">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>SQLite WAL</span>
            </div>
          </div>
        }
      />

      <TableExplorer />
    </div>
  );
}

