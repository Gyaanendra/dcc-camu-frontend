'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';
import { QRDisplayCard } from '@/components/qr/QRDisplayCard';
import { api } from '@/lib/api';
import { Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, teamsRes] = await Promise.all([api.getSessions(), api.getTeams()]);
      setSessions(sessionsRes.sessions || []);
      setTeams(teamsRes.teams || []);

      if (sessionsRes.sessions?.length > 0 && !selectedSession) {
        setSelectedSession(sessionsRes.sessions[0]);
        loadSessionDetail(sessionsRes.sessions[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetail = async (id: string) => {
    try {
      const res = await api.getSession(id);
      setSessionDetail(res);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSession = (s: any) => {
    setSelectedSession(s);
    loadSessionDetail(s.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Event Management
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Session & Live QR Manager
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Schedule sessions, project dynamic QR codes, and monitor live check-ins</p>
            </div>

            <CreateSessionModal teams={teams} onCreated={loadData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Sessions Directory
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedSession?.id === s.id
                        ? 'bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-sm border-slate-900 dark:border-zinc-700'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedSession?.id === s.id
                            ? 'bg-slate-800 dark:bg-zinc-700 text-slate-300 dark:text-zinc-300'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {s.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          s.isActive === 'true'
                            ? selectedSession?.id === s.id ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        {s.isActive === 'true' ? '● LIVE' : 'ENDED'}
                      </span>
                    </div>

                    <div className="font-bold text-sm mt-2">{s.title}</div>
                    <div
                      className={`text-[11px] mt-1 flex items-center gap-1 ${
                        selectedSession?.id === s.id ? 'text-slate-300 dark:text-zinc-400' : 'text-slate-500 dark:text-zinc-400'
                      }`}
                    >
                      <MapPin className="w-3 h-3" /> {s.location}
                    </div>

                    <div
                      className={`flex items-center justify-between text-[11px] font-mono mt-3 pt-2 border-t ${
                        selectedSession?.id === s.id
                          ? 'border-slate-800 dark:border-zinc-700 text-slate-400 dark:text-zinc-400'
                          : 'border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                      }`}
                    >
                      <span>{new Date(s.startTime).toLocaleDateString()}</span>
                      <span className={selectedSession?.id === s.id ? 'text-white dark:text-zinc-100 font-bold' : 'text-slate-900 dark:text-zinc-100 font-bold'}>
                        {s.attendeeCount} attended
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Session QR Broadcast & Attendees Feed */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSession ? (
                <>
                  <QRDisplayCard
                    title={selectedSession.title}
                    qrCodeToken={selectedSession.qrCodeToken}
                    subtitle="Broadcast on Screen for Member Check-in"
                    location={selectedSession.location}
                  />

                  {/* Real-time Attendees Feed */}
                  <div className="p-6 rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Real-time Attendance Feed
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        {sessionDetail?.attendeeCount || 0} Checked In
                      </span>
                    </div>

                    <div className="space-y-2">
                      {sessionDetail?.attendees?.length > 0 ? (
                        sessionDetail.attendees.map((a: any) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300 text-xs">
                                {a.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-zinc-100">{a.name}</div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{a.rollNumber}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  a.status === 'late'
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                }`}
                              >
                                {a.status}
                              </span>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                                {new Date(a.scannedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
                          No members have checked in for this session yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-xs dash-card bg-white dark:bg-zinc-900">
                  Select a session to view QR code.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
