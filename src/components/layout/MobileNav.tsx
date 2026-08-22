'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // If not logged in, don't show mobile nav
  if (!user || pathname === '/') return null;

  const isAdmin = user?.role === 'admin';

  const isActive = (path: string) => pathname === path;

  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Fixed Bottom Action Bar (visible on < lg screens) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 px-3 py-1.5 shadow-lg flex items-center justify-around">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            isActive('/dashboard')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          href="/scan"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all relative ${
            isActive('/scan')
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="p-2 -mt-4 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md border-2 border-white dark:border-zinc-950 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="mt-0.5">Scan QR</span>
        </Link>

        <Link
          href="/my-attendance"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            isActive('/my-attendance')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span>My Record</span>
        </Link>

        {isAdmin ? (
          <Link
            href="/admin/analytics"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
              isActive('/admin/analytics')
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>Analytics</span>
          </Link>
        ) : null}

        {/* Drawer Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Slide-over Backdrop & Mobile Navigation Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col justify-between p-5 border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-zinc-800 font-bold text-white text-xs shadow-sm">
                    DCC
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">Club DCC Camu</div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Portal Navigation</div>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">{user.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap">
                  <span>{user.rollNumber}</span>
                  <span>•</span>
                  <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">{user.role}</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 mt-1">
                  Wing: <span className="font-medium text-slate-700 dark:text-zinc-300">{user.teamName || 'All Club Members'}</span>
                </div>
              </div>

              {/* General Navigation */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  General
                </div>
                <Link
                  href="/dashboard"
                  onClick={closeDrawer}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive('/dashboard')
                      ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/scan"
                  onClick={closeDrawer}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive('/scan')
                      ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4" />
                    <span>Live QR Scanner</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/my-attendance"
                  onClick={closeDrawer}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive('/my-attendance')
                      ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4" />
                    <span>My Attendance Record</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>

              {/* Admin Tools Section */}
              {isAdmin && (
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Tools</span>
                  </div>

                  <Link
                    href="/admin/analytics"
                    onClick={closeDrawer}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive('/admin/analytics')
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4" />
                      <span>Team Analytics</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/sessions"
                    onClick={closeDrawer}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive('/admin/sessions')
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4" />
                      <span>Sessions & Live QR</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/members"
                    onClick={closeDrawer}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive('/admin/members')
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 font-semibold'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" />
                      <span>Member Directory</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom Actions (Theme & Logout) */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 capitalize">{theme}</span>
              </button>

              <button
                onClick={() => {
                  closeDrawer();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
