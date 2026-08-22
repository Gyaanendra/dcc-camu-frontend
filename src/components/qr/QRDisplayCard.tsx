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
    <div className="rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-6 flex flex-col items-center text-center shadow-sm">
      {/* Header Badge */}
      <div className="mb-2">
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-wider">
          {type === 'session' ? 'Live Session QR' : 'Digital Member ID'}
        </span>
        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-2">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Clean QR Render Box (High contrast white canvas for QR code readability) */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 dark:border-zinc-700 shadow-sm my-3 flex items-center justify-center">
        <QRCodeSVG value={qrCodeToken} size={160} level="H" includeMargin={false} />
      </div>

      {/* Footer Info */}
      <div className="w-full space-y-2 mt-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
        {location && (
          <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-zinc-300 font-sans">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{location}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans uppercase">Token:</span>
          <code className="px-2 py-0.5 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-[11px] font-semibold">
            {qrCodeToken}
          </code>
          <button
            onClick={handleCopy}
            className="p-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            title="Copy Token"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
