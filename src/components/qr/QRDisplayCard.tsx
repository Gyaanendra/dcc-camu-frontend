'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { cn } from '@/lib/utils';

interface QRDisplayCardProps {
  title: string;
  qrCodeToken: string;
  subtitle?: string;
  location?: string;
  expiresAt?: string;
  type?: 'session' | 'member';
  status?: 'live' | 'idle';
  avatarUrl?: string | null;
  /** Chromeless body for use inside an existing dialog (no Card, no nested dialog). Only API addition. */
  bare?: boolean;
}

export const QRDisplayCard: React.FC<QRDisplayCardProps> = ({
  title,
  qrCodeToken,
  subtitle,
  location,
  type = 'session',
  status,
  avatarUrl,
  bare = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const isLive = status ? status === 'live' : type === 'session';
  const initial = title ? title.charAt(0).toUpperCase() : type === 'session' ? 'S' : 'M';

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeToken);
    setCopied(true);
    toast.success('Token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRow = (
    <div className="flex items-center gap-2">
      <code
        title={qrCodeToken}
        className="min-w-0 flex-1 truncate rounded bg-secondary border border-border px-2 py-1 font-mono text-xs text-foreground tabular-nums"
      >
        {qrCodeToken}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 focus-orange"
        onClick={handleCopy}
        title="Copy Token"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );

  // Chromeless body — rendered inside a parent dialog (dashboard). No Card, no nested dialog.
  if (bare) {
    return (
      <div className="flex flex-col items-center text-center">
        {type === 'member' && (
          <div className="relative mb-3">
            <MemberAvatar
              src={avatarUrl}
              name={title}
              className="h-16 w-16 rounded-2xl border-2 border-border shadow-md ring-4 ring-accent/15"
            />
          </div>
        )}
        <div
          className={cn(
            'p-4 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm',
            isLive && 'ring-1 ring-emerald-500/30'
          )}
        >
          <QRCodeSVG value={qrCodeToken} size={216} level="H" includeMargin={false} />
        </div>
        <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        <div className="mt-3 w-full">{copyRow}</div>
      </div>
    );
  }

  // Standalone Member Pass Card (Attendance page)
  if (type === 'member') {
    return (
      <Card className="p-5 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle accent backdrop glow */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

        {/* Header Label */}
        <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-border text-xs text-muted-foreground font-medium relative z-10">
          <span className="flex items-center gap-1.5 font-semibold text-foreground tracking-tight">
            <span className="flex h-2 w-2 rounded-full bg-accent" />
            Member Digital ID
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">CLUB DCC</span>
        </div>

        {/* Large Prominent Avatar */}
        <div className="relative mb-3 group z-10">
          <MemberAvatar
            src={avatarUrl}
            name={title}
            className="h-20 w-20 rounded-2xl border-2 border-background shadow-lg ring-4 ring-accent/20 transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card" />
          </span>
        </div>

        {/* Name & Subtitle */}
        <h3 className="text-base font-bold text-foreground leading-snug z-10">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] truncate z-10" title={subtitle}>
            {subtitle}
          </p>
        )}

        {/* QR Code Container */}
        <div className="mt-4 flex flex-col items-center z-10">
          <Dialog open={enlarged} onOpenChange={setEnlarged}>
            <DialogTrigger asChild>
              <button
                className="p-3.5 rounded-xl bg-white border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] focus-orange group"
                title="Click to enlarge QR Code"
              >
                <QRCodeSVG value={qrCodeToken} size={156} level="H" includeMargin={false} />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogTitle className="sr-only">{title} QR code</DialogTitle>
              <div className="flex flex-col items-center text-center pt-2">
                <div className="relative mb-3">
                  <MemberAvatar
                    src={avatarUrl}
                    name={title}
                    className="h-16 w-16 rounded-2xl border-2 border-border shadow-md ring-4 ring-accent/15"
                  />
                </div>
                <div className="p-4 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center">
                  <QRCodeSVG value={qrCodeToken} size={220} level="H" includeMargin={false} />
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                  {qrCodeToken}
                </div>
                <div className="mt-4 w-full">{copyRow}</div>
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-[11px] text-muted-foreground mt-2">
            Click QR code to enlarge
          </span>
        </div>

        {/* Copy token row */}
        <div className="mt-4 pt-3.5 border-t border-border w-full z-10">
          {copyRow}
        </div>
      </Card>
    );
  }

  // Session QR Card
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-3">
        {/* Avatar-or-initial tile */}
        <div className="relative h-10 w-10 shrink-0 rounded-lg bg-secondary border border-border flex items-center justify-center text-sm font-bold text-foreground">
          {initial}
          {isLive && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="motion-safe:animate-ping absolute h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-card" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">{title}</div>
          <div
            title={qrCodeToken}
            className="font-mono text-xs text-muted-foreground truncate tabular-nums"
          >
            {qrCodeToken}
          </div>
          {subtitle && <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>}
        </div>
        {/* Small QR, tap-to-enlarge */}
        <Dialog open={enlarged} onOpenChange={setEnlarged}>
          <DialogTrigger asChild>
            <button
              className={cn(
                'shrink-0 p-1.5 rounded-lg bg-white border border-border focus-orange transition-all active:scale-[0.97]',
                isLive && 'ring-1 ring-emerald-500/30'
              )}
              title="Enlarge QR code"
            >
              <QRCodeSVG value={qrCodeToken} size={72} level="H" includeMargin={false} />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle className="sr-only">{title} QR code</DialogTitle>
            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={cn(
                  'p-4 rounded-lg bg-white border border-border flex items-center justify-center',
                  isLive && 'ring-1 ring-emerald-500/30'
                )}
              >
                <QRCodeSVG value={qrCodeToken} size={216} level="H" includeMargin={false} />
              </div>
              <div className="mt-3 font-mono text-xs text-muted-foreground tabular-nums" title={qrCodeToken}>
                {qrCodeToken}
              </div>
              <div className="mt-3 w-full">{copyRow}</div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {location && (
        <div className="mt-2.5 text-xs text-muted-foreground truncate">{location}</div>
      )}

      {/* Copy-token row */}
      <div className="mt-2.5 pt-2.5 border-t border-border">{copyRow}</div>
    </Card>
  );
};
