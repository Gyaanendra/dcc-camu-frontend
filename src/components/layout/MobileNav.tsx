'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  QrCode,
  Award,
  BarChart3,
  CalendarCheck,
  Users,
  Table2,
  X,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/ui/member-avatar';

// ─── Mobile Sidebar Drawer ─────────────────────────────────────────────────
// Visible only on <lg screens. Triggered by the hamburger in the Navbar.
// Same vocabulary as the desktop Sidebar: neutral gray section labels in
// sentence case, icon+label rows, neutral gray active pill.

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on login page or when not authenticated
  if (!user || pathname === '/') return null;

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'admin' || user?.role === 'advisor';
  const isActive = (path: string) => pathname === path;
  const close = () => setIsOpen(false);

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

  const rowClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] transition-colors duration-150',
      active
        ? 'bg-accent/10 text-accent font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium'
    );

  const iconClass = (active: boolean) =>
    cn('w-3.5 h-3.5 shrink-0', active && 'text-accent');

  return (
    <>
      {/* Hamburger trigger — Navbar opens this drawer via a global event,
          avoiding prop-drilling without a global store. */}
      <MobileNavTrigger onOpen={() => setIsOpen(true)} />

      {/* Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={close}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm anim-fade-in"
            aria-hidden
          />

          {/* Panel — slides from left */}
          <aside className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-sidebar border-r border-border anim-slide-left pb-[env(safe-area-inset-bottom)]">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <Link href="/dashboard" onClick={close} className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground font-bold text-background text-xs">
                  DCC
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-foreground">Club DCC Camu</div>
                  <div className="text-xs text-muted-foreground">Bennett University</div>
                </div>
              </Link>
              <button
                onClick={close}
                id="mobile-nav-close"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
              <div>
                <p className="px-2.5 mb-1 text-xs font-medium text-muted-foreground">
                  Overview
                </p>
                <div className="space-y-px">
                  {userNav.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        id={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        aria-current={active ? 'page' : undefined}
                        className={rowClass(active)}
                      >
                        <Icon className={iconClass(active)} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Admin section (advisors: view-only) */}
              {isViewer && (
                <div>
                  <p className="px-2.5 mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" />
                    {isAdmin ? 'Admin' : 'View only'}
                  </p>
                  <div className="space-y-px">
                    {adminNav.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          id={`mobile-nav-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          aria-current={active ? 'page' : undefined}
                          className={rowClass(active)}
                        >
                          <Icon className={iconClass(active)} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* User card */}
            <div className="px-3 py-2 border-t border-border">
              <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-secondary/30">
                <div className="relative shrink-0">
                  <MemberAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    className="h-10 w-10 rounded-xl border-2 border-border shadow-sm ring-1 ring-border/60"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-card" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground truncate leading-tight">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {[user.teamName, user.position].filter(Boolean).join(' · ') || 'Member'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                id="mobile-nav-theme-toggle"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-secondary border border-border text-foreground text-[13px] font-medium hover:bg-muted transition-colors duration-150"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark'
                    ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                    : <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
                <span className="text-xs font-mono text-muted-foreground capitalize">{theme}</span>
              </button>

              {/* Sign out */}
              <button
                onClick={() => { close(); logout(); }}
                id="mobile-nav-logout"
                className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-semibold hover:bg-destructive/20 transition-colors duration-150"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

// ─── Trigger component ────────────────────────────────────────────────────────
// Registers a global custom event listener so the Navbar's hamburger button
// can open this drawer without React prop-drilling or a global store.
const MobileNavTrigger: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-mobile-nav', handler);
    return () => window.removeEventListener('open-mobile-nav', handler);
  }, [onOpen]);
  return null;
};

// ─── Helper exported for Navbar ───────────────────────────────────────────────
export const openMobileNav = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-mobile-nav'));
  }
};
