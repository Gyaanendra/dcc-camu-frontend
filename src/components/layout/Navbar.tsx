'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, QrCode, Calendar, Sun, Moon, Menu } from 'lucide-react';
import Link from 'next/link';
import { openMobileNav } from '@/components/layout/MobileNav';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-2">
          {/* Hamburger — only visible on <lg */}
          {user && (
            <button
              onClick={openMobileNav}
              id="mobile-nav-open"
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground font-bold text-background text-[11px] tracking-tight shadow-sm transition-transform group-hover:scale-105">
              DCC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm tracking-tight leading-none">
                  Club DCC
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-medium text-muted-foreground leading-none">
                  Camu
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:block mt-0.5 leading-none">
                Bennett University
              </span>
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Date Badge — desktop only */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm font-medium text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            id="theme-toggle"
            className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {user ? (
            <>
              {/* Scan QR CTA — hidden on mobile (accessible via sidebar) */}
              <Link
                href="/scan"
                id="navbar-scan-qr"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </Link>

              {/* Profile + Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary border border-border font-semibold text-sm text-foreground overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-semibold text-foreground leading-tight">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <span>{user.rollNumber}</span>
                      <span>·</span>
                      <span className="font-semibold text-accent capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  id="navbar-logout"
                  className="hidden lg:block p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/"
              className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
