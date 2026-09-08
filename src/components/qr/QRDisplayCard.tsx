'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QRDisplayCardProps {
  title: string;
  qrCodeToken: string;
  subtitle?: string;
  location?: string;
  expiresAt?: string;
  type?: 'session' | 'member';
}

export const QRDisplayCard: React.FC<QRDisplayCardProps> = ({
  title,
  qrCodeToken,
  subtitle,
  location,
  type = 'session',
}) => {
  const [copied, setCopied] = useState(false);

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
        <Badge variant="secondary" className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {type === 'session' ? 'Live Session QR' : 'Digital Member ID'}
        </Badge>
        <h3 className="text-sm font-bold text-foreground mt-2">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {/* Clean QR Render Box (High contrast white canvas for QR code readability) */}
      <div className="p-4 rounded-xl bg-white border border-border my-3 flex items-center justify-center">
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
          <code className="px-2 py-0.5 rounded bg-secondary border border-border text-foreground text-[11px] font-semibold">
            {qrCodeToken}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
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
