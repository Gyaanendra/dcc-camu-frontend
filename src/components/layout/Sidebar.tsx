'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
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
  FileText,
  ClipboardCheck,
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
import { DCCLogo } from '@/components/ui/DCCLogo';

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
          { name: 'OD requests', href: '/od-requests', icon: FileText },
        ]),
  ];

  const adminNav = [
    { name: 'Team analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Sessions', href: '/admin/sessions', icon: CalendarCheck },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Attendance sheet', href: '/admin/attendance-sheet', icon: Table2 },
    { name: 'OD approvals', href: '/admin/od-approvals', icon: ClipboardCheck },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <ShadcnSidebar id="main-sidebar" aria-label="Main sidebar navigation">
      {/* Club workspace subheader */}
      <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center min-w-0 group py-0.5">
            <DCCLogo className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <Badge
            variant={isAdmin ? 'default' : 'secondary'}
            className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold shrink-0"
          >
            {user?.role || 'Member'}
          </Badge>
        </div>
      </SidebarHeader>

      {/* Independently scrollable nav items area */}
      <SidebarContent className="custom-scroll py-2">
        {/* User navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-3 py-1">
            General
          </SidebarGroupLabel>
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
                      className={cn(
                        "relative transition-all duration-150 rounded-lg px-3 py-2 text-[13px]",
                        active
                          ? "bg-accent/10 text-accent font-semibold border-l-[3px] border-accent rounded-l-none"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                      )}
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent" : "text-muted-foreground")} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.name === 'OD requests' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            CAMU
                          </span>
                        )}
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
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-3 py-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{isAdmin ? 'Admin & Ops' : 'Advisor View'}</span>
              </span>
              <span className="text-[10px] font-mono lowercase text-muted-foreground font-normal">
                {isAdmin ? 'ops' : 'read'}
              </span>
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
                        className={cn(
                          "relative transition-all duration-150 rounded-lg px-3 py-2 text-[13px]",
                          active
                            ? "bg-accent/10 text-accent font-semibold border-l-[3px] border-accent rounded-l-none"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                        )}
                      >
                        <Link href={item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={cn("w-4 h-4 shrink-0", active ? "text-accent" : "text-muted-foreground")} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.name === 'Sessions' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                              Live
                            </span>
                          )}
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
        <SidebarFooter className="border-t border-sidebar-border/60 p-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors group">
            <div className="relative shrink-0">
              <MemberAvatar
                src={user.avatarUrl}
                name={user.name}
                className="h-8 w-8 rounded-lg border border-border shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-card" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate leading-tight">
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
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg"
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
