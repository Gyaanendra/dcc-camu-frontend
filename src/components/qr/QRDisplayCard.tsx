'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="dash-card p-6 flex flex-col items-center text-center">
      {/* Header Badge */}
      <div className="mb-2">
        <span className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono text-[10px] font-bold uppercase tracking-wider">
          {type === 'session' ? 'Live Session QR' : 'Digital Member ID'}
        </span>
        <h3 className="text-sm font-bold text-foreground mt-2">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {/* Clean QR Render Box (High contrast white canvas for QR code readability) */}
      <div className="p-4 rounded-xl bg-white border border-border shadow-sm my-3 flex items-center justify-center">
        <QRCodeSVG value={qrCodeToken} size={160} level="H" includeMargin={false} />
      </div>

      {/* Footer Info */}
      <div className="w-full space-y-2 mt-2 text-xs font-mono text-muted-foreground">
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
          <button
            onClick={handleCopy}
            className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Copy Token"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
