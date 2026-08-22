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
  Award,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'QR Scanner', href: '/scan', icon: QrCode },
    { name: 'My Attendance', href: '/my-attendance', icon: Award },
  ];

  const adminNav = [
    { name: 'Team Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Sessions & QR', href: '/admin/sessions', icon: CalendarCheck },
    { name: 'Member Directory', href: '/admin/members', icon: Users },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-4 min-h-[calc(100vh-4rem)] transition-colors">
      <div className="space-y-6">
        {/* User Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
            Overview
          </div>
          <nav className="space-y-1">
            {userNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-500" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Tools
            </div>
            <nav className="space-y-1">
              {adminNav.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {active && <ChevronRight className="w-3 h-3 text-slate-400 dark:text-zinc-500" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Wing / Position Card */}
        {user && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-xs">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
              Club Assignment
            </div>
            <div className="font-semibold text-slate-900 dark:text-zinc-100 mt-1">{user.teamName || 'All Club Members'}</div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{user.position || 'Member'}</div>
          </div>
        )}
      </div>
    </aside>
  );
};
