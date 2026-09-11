'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sparkles, Terminal, Flame, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SigninPage() {
  const { login, user } = useAuth();
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
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 bg-background text-foreground overflow-hidden selection:bg-accent/20">

      {/* ── BACKGROUND LAYER: Notion-style Grid & Subtle Orbs ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45] dark:opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient soft glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* ── NOTIONIST / GEN-Z FLOATING SVG SHAPES & STICKERS ── */}

      {/* Top Left: Terminal snippet card */}
      <div className="absolute top-12 left-8 xl:left-16 hidden lg:block pointer-events-none select-none z-0">
        <div className="p-3.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-xl -rotate-6 hover:rotate-0 transition-transform duration-300 pointer-events-auto">
          <div className="flex items-center gap-1.5 pb-2 border-b border-border text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-red-400/80" />
            <span className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
            <span className="ml-1.5 text-[11px] font-medium">dcc-portal.ts</span>
          </div>
          <div className="font-mono text-xs pt-2.5 space-y-1 text-foreground leading-relaxed">
            <p><span className="text-accent font-semibold">import</span> &#123; createClub &#125; <span className="text-accent font-semibold">from</span> <span className="text-emerald-600 dark:text-emerald-400">&apos;@bennett/dcc&apos;</span>;</p>
            <p><span className="text-accent font-semibold">const</span> session = <span className="text-accent font-semibold">await</span> dcc.<span className="text-sky-500">scanLiveQR</span>();</p>
            <p className="text-muted-foreground text-[11px]">// 🚀 100% automated attendance</p>
          </div>
        </div>
      </div>

      {/* Top Right: Pill Sticker with status */}
      <div className="absolute top-16 right-8 xl:right-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-md shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300 select-none z-0">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-xs font-bold text-foreground tracking-tight">Developers &amp; Creators Club</span>
        <span className="text-xs px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-mono font-bold">BU</span>
      </div>

      {/* Mid Left: Notion Star Sparkle SVG */}
      <div className="absolute top-1/2 left-10 xl:left-24 -translate-y-1/2 hidden xl:block pointer-events-none select-none opacity-80">
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent animate-pulse">
          <path d="M21 0C21 11.598 11.598 21 0 21C11.598 21 21 30.402 21 42C21 30.402 30.402 21 42 21C30.402 21 21 11.598 21 0Z" fill="currentColor" fillOpacity="0.85" />
        </svg>
      </div>

      {/* Mid Right: Quirky Sticker Note */}
      <div className="absolute top-1/2 right-8 xl:right-24 -translate-y-1/2 hidden xl:block pointer-events-none select-none z-0">
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md shadow-md rotate-6 text-xs text-foreground font-medium pointer-events-auto hover:rotate-0 transition-transform">
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Streak Mode</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Never miss a club session</p>
        </div>
      </div>

      {/* Bottom Left: Gen-Z Tag */}
      <div className="absolute bottom-12 left-10 xl:left-20 hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-md -rotate-2 select-none z-0">
        <Code2 className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-mono font-medium text-foreground">Hack · Build · Ship</span>
        <span className="text-xs">⚡</span>
      </div>

      {/* Bottom Right: Campus Badge */}
      <div className="absolute bottom-14 right-10 xl:right-20 hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md shadow-md rotate-2 select-none z-0">
        <span className="text-xs font-mono text-muted-foreground">Bennett Univ CAMU</span>
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-xs font-semibold text-foreground">v2.0</span>
      </div>

      {/* Hand-drawn SVG wavy doodles */}
      <div className="absolute bottom-28 left-1/4 hidden md:block pointer-events-none opacity-30 dark:opacity-20">
        <svg width="120" height="24" viewBox="0 0 120 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 12C14 4 24 20 34 12C44 4 54 20 64 12C74 4 84 20 94 12C104 4 114 20 116 12" />
        </svg>
      </div>

      <div className="absolute top-24 right-1/4 hidden md:block pointer-events-none opacity-25 dark:opacity-15">
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round">
          <path d="M5 35C25 5 55 5 75 35" />
        </svg>
      </div>

      {/* ── LOGIN FORM CARD (CENTER) ── */}
      <div className="w-full max-w-sm space-y-6 relative z-10 anim-fade-up">
        {/* Brand mark */}
        <div className="text-center space-y-3">
          <div className="mx-auto relative group inline-block">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground font-black text-background text-sm tracking-tight shadow-xl ring-4 ring-accent/20 transition-transform group-hover:scale-105">
              DCC
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
          </div>
          <div>
            <h1 className="text-[30px] font-black tracking-[-0.03em] text-foreground text-balance">
              Club DCC
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
              <span>Bennett University</span>
              <span>·</span>
              <span>Developers &amp; Creators</span>
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <Card className="p-6 space-y-5 border-border/90 shadow-xl backdrop-blur-sm bg-card/95 rounded-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Member Portal
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">Sign In</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold">
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
                  className="pl-9 font-mono text-xs focus-orange h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold">
                  Password
                </Label>
                <span className="text-[11px] text-muted-foreground">e.g. user123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 focus-orange h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full h-10 font-bold focus-orange rounded-xl gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>{isSubmitting ? 'Verifying credentials…' : 'Enter Club Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Attendance &amp; Team Analytics · Club DCC Camu
          </p>
          <p className="text-[11px] font-mono text-muted-foreground/80">
            Official Campus Club Portal · Bennett University
          </p>
        </div>
      </div>
    </div>
  );
}
