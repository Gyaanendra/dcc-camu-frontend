'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';

interface AddMemberModalProps {
  teams: Array<{ id: string; name: string }>;
  onCreated?: () => void;
}

const inputClass =
  'w-full px-3.5 py-2 rounded-lg bg-transparent border border-input text-foreground outline-none focus:ring-1 focus:ring-ring shadow-sm transition-all';

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ teams, onCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [position, setPosition] = useState('Member');
  const [teamId, setTeamId] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRollNumber('');
    setPosition('Member');
    setTeamId('');
    setRole('user');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@bennett.edu.in')) {
      toast.error('Email must be a valid Bennett email ending with @bennett.edu.in');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createMember({
        name,
        email: trimmedEmail,
        password,
        rollNumber,
        position,
        teamId: teamId || null,
        role,
      });

      toast.success(`Member "${name.trim()}" added successfully`);
      setIsOpen(false);
      resetForm();
      if (onCreated) onCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
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
        <UserPlus className="w-4 h-4" /> Add Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4 anim-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Add New Member</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Bennett Email</label>
                  <input
                    type="email"
                    placeholder="s24cseu0771@bennett.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} font-mono`}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="s24cseu0771"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className={`${inputClass} font-mono`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Password</label>
                  <input
                    type="text"
                    placeholder="Initial login password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Position / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Assigned Wing / Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="user">User (Club Member)</option>
                    <option value="admin">Admin (Executive / Lead)</option>
                  </select>
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
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
