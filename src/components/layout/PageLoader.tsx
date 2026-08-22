import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading live data...' }) => {
  return (
    <div className="w-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{message}</p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">Syncing with Club DCC database</p>
      </div>
    </div>
  );
};
