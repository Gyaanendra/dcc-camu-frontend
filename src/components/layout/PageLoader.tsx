import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLoaderProps {
  message?: string;
}

// Three-layer loader:
//   Primary  — dot-bounce animation (3 bouncing accent dots)
//   Secondary — pulsing label text
//   Ambient  — shimmer skeleton cards beneath

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading live data...' }) => {
  return (
    <div className="w-full space-y-4 anim-fade-in">
      {/* ── Primary: dot bounce indicator ── */}
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="dot-loader flex items-end gap-1.5" aria-label="Loading">
          <span />
          <span />
          <span />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          <p className="text-[11px] text-muted-foreground font-mono">Syncing with Club DCC database</p>
        </div>
      </div>

      {/* ── Ambient: skeleton card placeholders ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
};
