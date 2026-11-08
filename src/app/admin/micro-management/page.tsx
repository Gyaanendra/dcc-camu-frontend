'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { MicroManagement } from '@/components/micro/MicroManagement';
import { Layers, ShieldCheck, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminMicroManagementPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar crumbs={[{ label: 'Admin' }, { label: 'Micro Management' }]} />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 w-full max-w-[99%] 2xl:max-w-none mx-auto space-y-6">
            <PageHeader
              icon={Layers}
              crumbs={[{ label: 'Admin' }, { label: 'Micro Management' }]}
              title="Micro Management"
              description="Command center for summit events, micro-team allocations (~5 member squads), dignitary VIP escort protocol, and live attendance oversight."
              actions={
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs gap-1.5 px-3 py-1 bg-muted/40 border-border/70"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>DCC Leadership</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border-amber-500/20"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>Summit Protocol</span>
                  </Badge>
                </div>
              }
            />

            <MicroManagement />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

