'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRDisplayCardProps {
  title: string;
  qrCodeToken: string;
  subtitle?: string;
  location?: string;
  expiresAt?: string;
  type?: 'session' | 'member';
  status?: 'live' | 'idle';
}

export const QRDisplayCard: React.FC<QRDisplayCardProps> = ({
  title,
  qrCodeToken,
  subtitle,
  location,
  type = 'session',
  status,
}) => {
  const [copied, setCopied] = useState(false);
  const isLive = status ? status === 'live' : type === 'session';

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCodeToken);
    setCopied(true);
    toast.success('Token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 flex flex-col items-center text-center">
      {/* Header Badge */}
      <div className="mb-2">
        <Badge
          variant="secondary"
          className={cn(
            'font-mono text-[10px] font-bold uppercase tracking-wider',
            isLive && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
          )}
        >
          {isLive && (
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="motion-safe:animate-ping absolute h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {type === 'session' ? 'Live Session QR' : 'Digital Member ID'}
        </Badge>
        <h3 className="text-sm font-bold text-foreground mt-2">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {/* Clean QR Render Box (High contrast white canvas for QR code readability) */}
      <div
        className={cn(
          'p-4 rounded-xl bg-white border border-border my-3 flex items-center justify-center',
          isLive && 'ring-1 ring-emerald-500/30'
        )}
      >
        <QRCodeSVG value={qrCodeToken} size={160} level="H" includeMargin={false} />
      </div>

      {/* Footer Info */}
      <div className="w-full space-y-2 mt-2 text-sm font-mono text-muted-foreground">
        {location && (
          <div className="flex items-center justify-center gap-1.5 text-foreground font-sans">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>{location}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground font-sans uppercase">Token:</span>
          <code
            title={qrCodeToken}
            className="px-2 py-0.5 rounded bg-secondary border border-border text-foreground text-[11px] font-semibold font-mono max-w-[140px] truncate"
          >
            {qrCodeToken}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 focus-orange"
            onClick={handleCopy}
            title="Copy Token"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};
