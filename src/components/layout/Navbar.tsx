'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, QrCode, Calendar, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-zinc-800 font-bold text-white text-xs shadow-sm border border-transparent dark:border-zinc-700 transition-transform group-hover:scale-105">
              DCC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight">
                  Club DCC
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-medium text-slate-600 dark:text-zinc-300">
                  Camu
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium hidden sm:block">
                Bennett University
              </span>
            </div>
          </Link>
        </div>

        {/* Date, Theme Toggle & User Actions */}
        <div className="flex items-center gap-3">
          {/* Today's Date Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>{today}</span>
          </div>

          {/* Theme Toggle Button (Light/Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <>
              {/* QR Scanner Primary CTA */}
              <Link
                href="/scan"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </Link>

              {/* Profile Dropdown Area */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-semibold text-xs text-slate-700 dark:text-zinc-300">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 leading-tight">{user.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1">
                      <span>{user.rollNumber}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">{user.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium text-xs shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
