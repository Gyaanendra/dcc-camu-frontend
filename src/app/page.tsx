'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SigninPage() {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      toast.success('Welcome back to Club DCC!');
      router.push('/dashboard');
    } catch {
      // Toast error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for demo accounts
  const handleQuickFill = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword('user123');
    toast.info(`Filled ${roleName} credentials (password: user123)`);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center bg-[#0c0a0f] text-foreground transition-colors selection:bg-orange-500/30 overflow-x-hidden">
      {/* ── Ambient Radial Lighting Background (Warm Orange/Amber Brand Hue) ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 18%, rgba(249, 115, 22, 0.22) 0%, transparent 55%), radial-gradient(circle at 82% 82%, rgba(234, 88, 12, 0.15) 0%, transparent 50%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Top Header Navigation Bar ────────────────────────────── */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5 z-20">
        <div className="flex items-center gap-2.5 text-xs font-mono text-white/60">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Bennett University · Developers &amp; Creators Club</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer shadow-xs backdrop-blur-md"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Central Split Auth Showcase Card ─────────────────────── */}
      <main className="w-full max-w-5xl px-4 py-4 sm:py-6 relative z-10 flex items-center justify-center my-auto">
        <div className="w-full rounded-[28px] bg-[#16131c]/90 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-3 sm:p-3.5 flex flex-col md:flex-row overflow-hidden transition-all duration-300">
          {/* ── Left Hero Panel (Visual Sunset Dunes Showcase) ─────── */}
          <div className="w-full md:w-[46%] lg:w-[48%] relative rounded-[22px] overflow-hidden min-h-[380px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-8 select-none border border-white/10 group">
            {/* Background Image: Sunset Dunes */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url('/login-hero.jpg')` }}
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a0f]/95 via-[#0c0a0f]/30 to-[#0c0a0f]/40 pointer-events-none" />
            <div className="absolute inset-0 bg-orange-950/15 mix-blend-overlay pointer-events-none" />

            {/* Top Bar inside Image */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/dcc-white.png"
                  alt="DCC Logo"
                  className="h-7 w-auto object-contain drop-shadow-md"
                />
                <span className="font-bold text-white tracking-wider text-sm">DCC</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium shadow-xs">
                <span>Bennett CAMU</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </div>
            </div>

            {/* Bottom Content inside Image */}
            <div className="relative z-10 space-y-3 pt-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
                Capturing Moments,
                <br />
                Creating Memories
              </h2>
              <p className="text-xs text-white/75 max-w-xs leading-relaxed">
                Empowering creators, developers, and leaders across Bennett University with real-time attendance and wing analytics.
              </p>

              {/* Aesthetic Slider Indicator */}
              <div className="flex items-center gap-1.5 pt-2">
                <span className="h-1 w-7 rounded-full bg-orange-500 transition-all shadow-xs" />
                <span className="h-1 w-2 rounded-full bg-white/40 transition-all" />
                <span className="h-1 w-2 rounded-full bg-white/40 transition-all" />
              </div>
            </div>
          </div>

          {/* ── Right Form Panel (Sign In) ────────────────────────── */}
          <div className="w-full md:w-[54%] lg:w-[52%] flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-8 sm:py-10">
            {/* Header Titles */}
            <div className="space-y-1.5 mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Sign in to DCC
              </h1>
              <p className="text-xs text-white/50">
                Enter your Bennett University email and password to continue
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* University Email */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-white/80">
                  University Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@bennett.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="pl-10 h-11 bg-[#201c27] border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs font-mono transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-white/80">
                    Password
                  </Label>
                  <span className="text-[11px] font-mono text-orange-400/90">Default: user123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-[#201c27] border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white/90 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-[#201c27] text-orange-500 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer accent-orange-500"
                  />
                  <span>Remember this device</span>
                </label>
                <span className="text-[11px] font-mono text-white/40">CAMU Authenticated</span>
              </div>

              {/* Submit CTA Button (Brand Orange to Amber Gradient) */}
              <Button
                type="submit"
                id="login-submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-1 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:via-orange-500 hover:to-amber-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition-all duration-200 cursor-pointer active:scale-[0.99] border-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in to Portal
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#16131c] px-3 text-[10px] text-white/40 uppercase tracking-wider font-mono">
                Quick Demo Access
              </span>
            </div>

            {/* Quick Demo Access Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('s24cseu0771@bennett.edu.in', 'Admin')}
                className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-white/10 bg-[#201c27]/60 hover:bg-[#201c27] hover:border-orange-500/40 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer"
                title="Fill Admin test credentials"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Admin Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('s24cseu0656@bennett.edu.in', 'Member')}
                className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-white/10 bg-[#201c27]/60 hover:bg-[#201c27] hover:border-amber-500/40 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer"
                title="Fill Member test credentials"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Member Demo</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Minimalist Clean Footer ──────────────────────────────── */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-5 text-center text-xs text-white/40 z-20">
        <p>© 2026 Club DCC · Bennett University Developers &amp; Creators Club</p>
      </footer>
    </div>
  );
}
