'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, Search, Calendar, Sun, Moon, Menu, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { openMobileNav } from '@/components/layout/MobileNav';
import { openCommandPalette } from '@/components/layout/CommandPalette';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/components/ui/member-avatar';

export interface Crumb {
  label: string;
  href?: string;
}

export const Navbar: React.FC<{ crumbs?: Crumb[] }> = ({ crumbs }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background transition-colors">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">

        {/* Left: hamburger (mobile) + brand + breadcrumbs */}
        <div className="flex min-w-0 items-center gap-2">
          {user && (
            <button
              onClick={openMobileNav}
              id="mobile-nav-open"
              className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground font-bold text-background text-xs tracking-tight transition-colors duration-150 group-hover:bg-accent group-hover:text-white">
              DCC
            </div>
            <span className="font-semibold text-foreground text-[13px] tracking-tight leading-none">
              Club DCC
            </span>
          </Link>

          {/* Breadcrumb slot (page provides crumbs) */}
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden md:flex min-w-0 items-center gap-1 text-[13px]">
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              {crumbs.map((crumb, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <span key={crumb.label} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground">/</span>}
                    {crumb.href && !last ? (
                      <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors duration-150 truncate">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? 'page' : undefined} className={last ? 'text-foreground font-medium truncate' : 'text-muted-foreground truncate'}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Search trigger — opens command palette */}
          {user && (
            <>
              <button
                onClick={openCommandPalette}
                id="navbar-search"
                className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-[13px] transition-colors duration-150"
                title="Search or jump to… (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search…</span>
                <kbd className="font-mono text-xs px-1 rounded border border-border bg-background">⌘K</kbd>
              </button>
              <button
                onClick={openCommandPalette}
                className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                aria-label="Search (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Date — desktop only, mono */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-8 rounded-md font-mono text-xs text-muted-foreground tabular-nums">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            id="theme-toggle"
            className="h-8 w-8 focus-orange"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-500" />
              : <Moon className="w-4 h-4" />
            }
          </Button>

          {user ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-border">
              <MemberAvatar src={user.avatarUrl} name={user.name} className="h-7 w-7 border border-border shrink-0" />
              <div className="hidden lg:block text-left">
                <div className="text-[13px] font-medium text-foreground leading-tight max-w-[140px] truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize leading-tight">{user.role}</div>
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
          ) : (
            <Button asChild className="h-8">
              <Link href="/">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
