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
  Table2,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/ui/member-avatar';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'admin' || user?.role === 'advisor';

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'advisor'
      ? []
      : [
          { name: 'Scan QR', href: '/scan', icon: QrCode },
          { name: 'My attendance', href: '/my-attendance', icon: Award },
        ]),
  ];

  const adminNav = [
    { name: 'Team analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Sessions', href: '/admin/sessions', icon: CalendarCheck },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Attendance sheet', href: '/admin/attendance-sheet', icon: Table2 },
  ];

  const isActive = (path: string) => pathname === path;

  const rowClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-colors duration-150',
      active
        ? 'bg-accent/10 text-accent font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium'
    );

  const iconClass = (active: boolean) =>
    cn('w-3.5 h-3.5 shrink-0', active && 'text-accent');

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col border-r border-border bg-sidebar min-h-[calc(100vh-3rem)] transition-colors">
      <div className="flex-1 p-3 space-y-5 overflow-y-auto">
        {/* User navigation */}
        <div>
          <p className="px-2.5 mb-1 text-xs font-medium text-muted-foreground">
            Overview
          </p>
          <nav className="space-y-px">
            {userNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  aria-current={active ? 'page' : undefined}
                  className={rowClass(active)}
                >
                  <Icon className={iconClass(active)} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin navigation (advisors: view-only) */}
        {isViewer && (
          <div>
            <p className="px-2.5 mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="w-3 h-3" />
              {isAdmin ? 'Admin' : 'View only'}
            </p>
            <nav className="space-y-px">
              {adminNav.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`sidebar-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-current={active ? 'page' : undefined}
                    className={rowClass(active)}
                  >
                    <Icon className={iconClass(active)} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User card — pinned at bottom */}
      {user && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/70 transition-all duration-150 group">
            <div className="relative shrink-0">
              <MemberAvatar
                src={user.avatarUrl}
                name={user.name}
                className="h-10 w-10 rounded-xl border-2 border-border shadow-sm ring-1 ring-border/60 group-hover:ring-accent/40 group-hover:scale-105 transition-all"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-card" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {[user.teamName, user.position].filter(Boolean).join(' · ') || 'Member'}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
