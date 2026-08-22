'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, MapPin, X } from 'lucide-react';

interface CreateSessionModalProps {
  teams: Array<{ id: string; name: string }>;
  onCreated?: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ teams, onCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'regular' | 'workshop' | 'hackathon' | 'standup'>('workshop');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [location, setLocation] = useState('Bennett CS Auditorium (Room 301)');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Please enter a session title');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSession({
        title,
        type,
        description,
        teamId: teamId || null,
        location,
        durationMinutes,
      });

      toast.success('Session created with dynamic QR token');
      setIsOpen(false);
      setTitle('');
      setDescription('');
      if (onCreated) onCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm flex items-center gap-2 transition-all"
      >
        <Plus className="w-4 h-4" /> Create Session & QR
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Create Club Session / Event
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 14 Fullstack Masterclass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium outline-none focus:border-slate-900 shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Session Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                  >
                    <option value="regular">Regular Meeting</option>
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon / Sprint</option>
                    <option value="standup">Wing Standup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Wing Restriction</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                  >
                    <option value="">All Wings (Open Session)</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Location / Room</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Topic outline, prerequisites, room details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 outline-none focus:border-slate-900 shadow-sm"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-all"
                >
                  Create & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
