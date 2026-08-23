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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error('Please enter your Bennett University email.');
      return;
    }
    if (!isBennettEmail(normalizedEmail)) {
      toast.error('Sign in requires a valid Bennett University email ending with @bennett.edu.in');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      router.push('/dashboard');
    } catch {
      // Toast error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background text-foreground transition-colors relative">

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        id="login-theme-toggle"
        className="absolute top-5 right-5 p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        title="Toggle Theme"
      >
        {theme === 'dark'
          ? <Sun className="w-4 h-4 text-amber-400" />
          : <Moon className="w-4 h-4" />
        }
      </button>

      <div className="w-full max-w-sm space-y-6">

        {/* Brand mark */}
        <div className="text-center space-y-3 anim-fade-up">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-foreground font-extrabold text-background text-sm shadow-sm">
            DCC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Club DCC Camu
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Bennett University · Developers &amp; Creators Club
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="dash-card p-6 sm:p-8 space-y-5 anim-fade-up anim-delay-1">
          <div className="pb-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Sign In to Portal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your Bennett credentials to continue
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-foreground">
                Bennett University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="s24cseu0771@bennett.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value.toLowerCase())}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full h-9 pl-9 pr-3.5 rounded-lg bg-transparent border border-input text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 pl-9 pr-3.5 rounded-lg bg-transparent border border-input text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full h-9 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Attendance &amp; Team Analytics Engine for Club DCC
        </p>
      </div>
    </div>
  );
}
