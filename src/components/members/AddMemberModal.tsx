'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddMemberModalProps {
  teams: Array<{ id: string; name: string }>;
  onCreated?: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ teams, onCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [position, setPosition] = useState('Member');
  const [teamId, setTeamId] = useState('');
  const [role, setRole] = useState<'admin' | 'advisor' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advisors are view-only — never show the create control to them.
  if (user?.role === 'advisor') return null;

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              type="text"
              placeholder="e.g. Rohan Gupta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-email">Bennett Email</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="s24cseu0771@bennett.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-roll">Roll Number</Label>
              <Input
                id="add-roll"
                type="text"
                placeholder="s24cseu0771"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="text"
                placeholder="Initial login password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-position">Position / Title</Label>
              <Input
                id="add-position"
                type="text"
                placeholder="e.g. Frontend Developer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assigned Wing / Team</Label>
              <Select value={teamId || '__unassigned'} onValueChange={(v) => setTeamId(v === '__unassigned' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned">Unassigned</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role Permission</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Club Member)</SelectItem>
                  <SelectItem value="advisor">Advisor (View-only)</SelectItem>
                  <SelectItem value="admin">Admin (Executive / Lead)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
