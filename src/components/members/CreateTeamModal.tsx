'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface CreateTeamModalProps {
  onCreated?: () => void;
}

const inputClass =
  'w-full px-3.5 py-2 rounded-lg bg-transparent border border-input text-foreground outline-none focus:ring-1 focus:ring-ring shadow-sm transition-all';

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Team name and code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createTeam({
        name,
        code,
        description,
        color,
      });

      toast.success(`Wing "${name.trim()}" created successfully`);
      setIsOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setColor('#3b82f6');
      if (onCreated) onCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-secondary-foreground hover:bg-muted font-medium text-xs shadow-sm flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Create Team / Wing
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4 anim-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Create New Team / Wing</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Web Development Wing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Team Code (Short Identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. WEB"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={20}
                  className={`${inputClass} font-mono uppercase`}
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">Stored in uppercase. Must be unique across all wings.</p>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="What this wing focuses on..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Team Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {TEAM_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        color === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-7 w-7 rounded-full cursor-pointer bg-transparent border border-border"
                    title="Custom color"
                  />
                </div>
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
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
