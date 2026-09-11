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
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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

  return (
    <ShadcnSidebar id="main-sidebar" aria-label="Main sidebar navigation">
      {/* Club workspace subheader */}
      <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/15 text-accent font-bold text-[10px]">
              D
            </div>
            <span className="truncate text-xs font-semibold text-foreground tracking-tight">
              DCC Portal
            </span>
          </div>
          <Badge
            variant={isAdmin ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold"
          >
            {user?.role || 'Member'}
          </Badge>
        </div>
      </SidebarHeader>

      {/* Independently scrollable nav items area */}
      <SidebarContent>
        {/* User navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNav.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      id={`sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Link href={item.href}>
                        <Icon className={active ? 'text-accent' : 'text-muted-foreground'} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin navigation (advisors: view-only) */}
        {isViewer && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <ShieldCheck className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>{isAdmin ? 'Admin & Ops' : 'View only'}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        id={`sidebar-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Link href={item.href}>
                          <Icon className={active ? 'text-accent' : 'text-muted-foreground'} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User profile card — permanently pinned at bottom of viewport */}
      {user && (
        <SidebarFooter>
          <div className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-sidebar-accent/60 transition-colors group">
            <div className="relative shrink-0">
              <MemberAvatar
                src={user.avatarUrl}
                name={user.name}
                className="h-8 w-8 rounded-lg border border-border shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-card" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate leading-tight">
                {user.name}
              </div>
              <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {[user.teamName, user.position].filter(Boolean).join(' · ') || user.role}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </SidebarFooter>
      )}
    </ShadcnSidebar>
  );
};
