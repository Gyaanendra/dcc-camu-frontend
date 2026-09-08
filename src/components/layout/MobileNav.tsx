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
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Mobile Sidebar Drawer ─────────────────────────────────────────────────
// Visible only on <lg screens. Triggered by a hamburger in the Navbar.
// The drawer slides in from the left and is identical in structure to the
// desktop Sidebar, plus theme toggle + sign-out at the bottom.

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on login page or when not authenticated
  if (!user || pathname === '/') return null;

  const isAdmin = user?.role === 'admin';
  const isActive = (path: string) => pathname === path;
  const close = () => setIsOpen(false);

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'QR Scanner', href: '/scan', icon: QrCode },
    { name: 'My Attendance', href: '/my-attendance', icon: Award },
  ];

  const adminNav = [
    { name: 'Team Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Sessions & QR', href: '/admin/sessions', icon: CalendarCheck },
    { name: 'Member Directory', href: '/admin/members', icon: Users },
    { name: 'Attendance Sheet', href: '/admin/attendance-sheet', icon: Table2 },
  ];

  return (
    <>
      {/* Hamburger trigger — rendered inside Navbar via portal-less slot.
          We expose a global open trigger through a custom DOM event so the
          Navbar button can open this drawer without prop-drilling. */}
      <MobileNavTrigger onOpen={() => setIsOpen(true)} />

      {/* Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={close}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm anim-fade-in"
            aria-hidden
          />

          {/* Panel — slides from left */}
          <aside className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-card border-r border-border shadow-xl anim-slide-left">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground font-bold text-background text-[11px]">
                  DCC
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Club DCC Camu</div>
                  <div className="text-[10px] text-muted-foreground">Bennett University</div>
                </div>
              </Link>
              <button
                onClick={close}
                id="mobile-nav-close"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User card */}
            <div className="px-3 py-3 border-b border-border anim-fade-up anim-delay-1">
              <div className="p-3 rounded-xl bg-secondary border border-border text-sm">
                <div className="font-semibold text-foreground truncate">{user.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                  <span>{user.rollNumber}</span>
                  <span>·</span>
                  <span className="text-accent font-semibold capitalize">{user.role}</span>
                </div>
                {user.teamName && (
                  <div className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border">
                    Wing: <span className="font-medium text-foreground">{user.teamName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 anim-fade-up anim-delay-2">
              {/* User section */}
              <div>
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Overview
                </p>
                <div className="space-y-0.5">
                  {userNav.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        id={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all anim-btn-press active:scale-[0.97]',
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
                </div>
              </div>

              {/* Admin section */}
              {isAdmin && (
                <div>
                  <p className="px-3 mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-accent uppercase">
                    <ShieldCheck className="w-3 h-3" />
                    Admin Tools
                  </p>
                  <div className="space-y-0.5">
                    {adminNav.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          id={`mobile-nav-admin-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
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
                  </div>
                </div>
              )}
            </nav>

            {/* Bottom actions */}
            <div className="px-3 py-3 border-t border-border space-y-2 anim-fade-up anim-delay-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                id="mobile-nav-theme-toggle"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark'
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-muted-foreground" />
                  }
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground capitalize">{theme}</span>
              </button>

              {/* Sign out */}
              <button
                onClick={() => { close(); logout(); }}
                id="mobile-nav-logout"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
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
