'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        id="login-theme-toggle"
        className="absolute top-5 right-5 focus-orange"
        title="Toggle Theme"
      >
        {theme === 'dark'
          ? <Sun className="w-4 h-4 text-amber-500" />
          : <Moon className="w-4 h-4" />
        }
      </Button>

      <div className="w-full max-w-sm space-y-6">

        {/* Brand mark */}
        <div className="text-center space-y-3 anim-fade-up">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-foreground font-extrabold text-background text-sm ring-1 ring-border">
            DCC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Club DCC Camu
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              Bennett University · Developers &amp; Creators Club
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <Card className="p-6 sm:p-8 space-y-5 anim-fade-up anim-delay-1 dash-card">
          <div className="pb-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Sign In to Portal</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter your Bennett credentials to continue
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">
                Bennett University Email
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="s24cseu0771@bennett.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value.toLowerCase())}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="pl-9 font-mono focus-orange"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password">
                Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 font-mono focus-orange"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full anim-btn-press focus-orange"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Attendance &amp; Team Analytics Engine for Club DCC
        </p>
      </div>
    </div>
  );
}
