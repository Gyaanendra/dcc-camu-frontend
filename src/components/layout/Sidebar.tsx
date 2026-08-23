'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  BarChart3,
  CalendarCheck,
  Users,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'QR Scanner', href: '/scan', icon: QrCode },
    { name: 'My Attendance', href: '/my-attendance', icon: Award },
  ];

  const adminNav = [
    { name: 'Team Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Sessions & QR', href: '/admin/sessions', icon: CalendarCheck },
    { name: 'Member Directory', href: '/admin/members', icon: Users },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col border-r border-border bg-card min-h-[calc(100vh-3.5rem)] transition-colors">
      <div className="flex-1 p-3 space-y-5 overflow-y-auto">

        {/* User Navigation */}
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Overview
          </p>
          <nav className="space-y-0.5">
            {userNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-muted-foreground')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div>
            <p className="px-3 mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-accent uppercase">
              <ShieldCheck className="w-3 h-3" />
              Admin Tools
            </p>
            <nav className="space-y-0.5">
              {adminNav.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`sidebar-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-muted-foreground')} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Club Assignment Card — pinned at bottom */}
      {user && (
        <div className="p-3 border-t border-border">
          <div className="p-3 rounded-xl bg-secondary border border-border text-xs">
            <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">
              Club Assignment
            </div>
            <div className="font-semibold text-foreground truncate">
              {user.teamName || 'All Club Members'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {user.position || 'Member'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
