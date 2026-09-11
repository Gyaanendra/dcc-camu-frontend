'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Search,
  Moon,
  Sun,
  LogOut,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Global open trigger (Navbar search button dispatches this) ─────────────
export const openCommandPalette = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  }
};

const RECENT_KEY = 'dcc_recent_pages';
const MAX_RECENT = 5;

interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ALL_ROUTES: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Scan QR', href: '/scan', icon: QrCode },
  { label: 'My attendance', href: '/my-attendance', icon: Award },
  { label: 'Team analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Sessions', href: '/admin/sessions', icon: CalendarCheck },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Attendance sheet', href: '/admin/attendance-sheet', icon: Table2 },
];

const routeByHref = new Map(ALL_ROUTES.map(r => [r.href, r]));

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

// ─── Command palette ─────────────────────────────────────────────────────────
// Radix Dialog (focus trap + Esc natively) + manual substring filter.
// Motion: dialog chrome is duration-200 per Phase 2 — nothing decorative added.
export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Cmd/Ctrl+K + programmatic open event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  // Reset query + selection whenever opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus is trapped by Radix; ensure the input gets it on open
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open ]);

  const isAdvisor = user?.role === 'advisor';
  const canViewAdmin = user?.role === 'admin' || user?.role === 'advisor';

  const goTargets = useMemo<NavEntry[]>(() => {
    if (!user) return [];
    return ALL_ROUTES.filter(r => {
      if (r.href.startsWith('/admin')) return canViewAdmin;
      if (r.href === '/scan' || r.href === '/my-attendance') return !isAdvisor;
      return true;
    });
  }, [user, canViewAdmin, isAdvisor]);

  const recent = useMemo<NavEntry[]>(() => {
    if (!open) return [];
    return readRecent()
      .map(h => routeByHref.get(h))
      .filter((r): r is NavEntry => !!r && goTargets.some(g => g.href === r.href) && r.href !== pathname);
  }, [open, goTargets, pathname]);

  const q = query.trim().toLowerCase();
  const match = useCallback((label: string) => !q || label.toLowerCase().includes(q), [q]);

  const filteredGo = goTargets.filter(r => match(r.label));
  const filteredRecent = recent.filter(r => match(r.label));

  const actions = useMemo(() => {
    const list: { label: string; hint: string; icon: LucideIcon; run: () => void }[] = [];
    if (!isAdvisor) {
      list.push({ label: 'Scan QR', hint: 'Go to scanner', icon: QrCode, run: () => router.push('/scan') });
    }
    list.push({
      label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      hint: 'Toggle theme',
      icon: theme === 'dark' ? Sun : Moon,
      run: toggleTheme,
    });
    list.push({ label: 'Sign out', hint: 'Log out', icon: LogOut, run: logout });
    return list.filter(a => match(a.label));
  }, [isAdvisor, theme, toggleTheme, logout, router, match]);

  // Flat keyboard order: recent → go to → actions
  const flat = useMemo(() => {
    const items: { key: string; run: () => void }[] = [
      ...filteredRecent.map(r => ({ key: `recent:${r.href}`, run: () => runGo(r.href) })),
      ...filteredGo.map(r => ({ key: `go:${r.href}`, run: () => runGo(r.href) })),
      ...actions.map((a, i) => ({ key: `action:${i}`, run: a.run })),
    ];
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRecent, filteredGo, actions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runGo = (href: string) => {
    try {
      const prev = readRecent().filter(h => h !== href);
      localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...prev].slice(0, MAX_RECENT)));
    } catch {
      // localStorage unavailable — palette still works, recents just don't persist
    }
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[activeIndex]?.run();
    }
    // Esc is handled natively by Radix Dialog
  };

  if (!user) return null;

  const rowClass = (index: number) =>
    cn(
      'flex w-full items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-left transition-colors duration-150',
      index === activeIndex ? 'bg-accent/10 text-accent font-semibold' : 'text-muted-foreground'
    );

  let cursor = -1;
  const nextIndex = (count: number) => {
    cursor += count;
    return cursor;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[20%] translate-y-0 p-0 gap-0 max-w-md overflow-hidden"
        onKeyDown={onKeyDown}
        aria-label="Command palette"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search pages…"
            className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={`cmd-item-${activeIndex}`}
          />
          <kbd className="font-mono text-xs px-1 rounded border border-border bg-secondary text-muted-foreground">esc</kbd>
        </div>
        <div ref={listRef} id="cmd-list" role="listbox" className="max-h-[320px] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">No results for “{query}”</p>
          )}
          {filteredRecent.length > 0 && (
            <div className="mb-1">
              <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Recent</p>
              {filteredRecent.map(r => {
                const Icon = r.icon;
                const idx = nextIndex(1);
                return (
                  <button key={`recent:${r.href}`} id={`cmd-item-${idx}`} data-index={idx} role="option" aria-selected={idx === activeIndex} className={rowClass(idx)} onMouseEnter={() => setActiveIndex(idx)} onClick={() => runGo(r.href)}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {filteredGo.length > 0 && (
            <div className="mb-1">
              <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Go to</p>
              {filteredGo.map(r => {
                const Icon = r.icon;
                const idx = nextIndex(1);
                return (
                  <button key={`go:${r.href}`} id={`cmd-item-${idx}`} data-index={idx} role="option" aria-selected={idx === activeIndex} className={rowClass(idx)} onMouseEnter={() => setActiveIndex(idx)} onClick={() => runGo(r.href)}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{r.label}</span>
                    <CornerDownLeft className="ml-auto w-3 h-3 shrink-0 opacity-50" />
                  </button>
                );
              })}
            </div>
          )}
          {actions.length > 0 && (
            <div>
              <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Actions</p>
              {actions.map((a, i) => {
                const Icon = a.icon;
                const idx = nextIndex(1);
                return (
                  <button key={`action:${i}`} id={`cmd-item-${idx}`} data-index={idx} role="option" aria-selected={idx === activeIndex} className={rowClass(idx)} onMouseEnter={() => setActiveIndex(idx)} onClick={() => { setOpen(false); a.run(); }}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{a.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{a.hint}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
