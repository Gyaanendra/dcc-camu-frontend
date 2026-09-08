'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface CreateSessionModalProps {
  teams: Array<{ id: string; name: string }>;
  onCreated?: () => void;
}

const inputClass =
  'w-full px-3.5 py-2 rounded-lg bg-transparent border border-input text-foreground outline-none focus:ring-1 focus:ring-ring shadow-sm transition-all';

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
        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs shadow-sm flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Session & QR
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4 anim-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Create Club Session / Event</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-foreground font-medium mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 14 Fullstack Masterclass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1">Session Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="regular">Regular Meeting</option>
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon / Sprint</option>
                    <option value="standup">Wing Standup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1">Wing Restriction</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className={inputClass}
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
                  <label className="block text-foreground font-medium mb-1">Location / Room</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Topic outline, prerequisites, room details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
