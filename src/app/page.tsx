'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

export default function SigninPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const isBennettEmail = (emailStr: string) => {
    return /^[a-zA-Z0-9._%+-]+@bennett\.edu\.in$/i.test(emailStr.trim());
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBennettEmail(email)) {
      toast.error('Sign in requires a valid Bennett University email ending with @bennett.edu.in (e.g. s24cseu0771@bennett.edu.in)');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Toast error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors relative">
      {/* Top Corner Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Editorial Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 dark:bg-zinc-800 font-extrabold text-white text-lg shadow-sm border border-transparent dark:border-zinc-700">
            DCC
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Club DCC Camu
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Bennett University • Developers & Creators Club
          </p>
        </div>

        {/* Clean Neutral Sign In Card */}
        <div className="dash-card bg-white dark:bg-zinc-900/90 p-8 space-y-6 shadow-sm border border-slate-200 dark:border-zinc-800">
          <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Sign In to Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Enter your Bennett credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Bennett University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  placeholder="s24cseu0771@bennett.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 dark:focus:border-zinc-500 outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 dark:focus:border-zinc-500 outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
          Attendance & Team Analytics Engine for Club DCC
        </div>
      </div>
    </div>
  );
}
