'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, QrCode, Calendar, Sun, Moon, Menu } from 'lucide-react';
import Link from 'next/link';
import { openMobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground font-bold text-background text-[11px] tracking-tight transition-transform group-hover:scale-105">
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
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border font-mono text-[12px] font-medium text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            id="theme-toggle"
            className="focus-orange"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-500" />
              : <Moon className="w-4 h-4" />
            }
          </Button>

          {user ? (
            <>
              {/* Scan QR CTA — hidden on mobile + hidden for view-only advisors */}
              {user.role !== 'advisor' && (
                <Button asChild id="navbar-scan-qr" className="hidden sm:inline-flex focus-orange">
                  <Link href="/scan">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </Link>
                </Button>
              )}

              {/* Profile + Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-border hover:scale-105 transition-transform shrink-0">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-semibold text-foreground leading-tight max-w-[140px] truncate">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <span>{user.rollNumber}</span>
                      <span>·</span>
                      <span className="font-semibold text-accent capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  id="navbar-logout"
                  className="hidden lg:inline-flex h-8 w-8 focus-orange"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <Button asChild>
              <Link href="/">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
