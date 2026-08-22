'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { api } from '@/lib/api';

export default function ScanPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    api.getSessions().then((res) => {
      setSessions(res.sessions || []);
      const active = res.sessions?.find((s: any) => s.isActive === 'true');
      if (active) setSelectedSessionId(active.id);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Attendance Check-in
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Live QR Attendance Scanner</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Scan session QR code using device camera or roll number</p>
            </div>

            {/* Session Selector for Admin mode */}
            {sessions.length > 0 && (
              <div className="w-full sm:w-64">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">Target Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-medium focus:border-slate-900 dark:focus:border-zinc-600 outline-none shadow-sm"
                >
                  <option value="">Auto-Detect via QR Token</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.isActive === 'true' ? 'Active' : 'Ended'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Scanner Card */}
          <QRScannerModal activeSessionId={selectedSessionId} />
        </main>
      </div>
    </div>
  );
}
