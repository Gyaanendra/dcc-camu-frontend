'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
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

interface CreateSessionModalProps {
  teams: Array<{ id: string; name: string }>;
  onCreated?: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ teams, onCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'regular' | 'workshop' | 'hackathon' | 'standup'>('workshop');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [location, setLocation] = useState('Bennett CS Auditorium (Room 301)');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advisors are view-only.
  if (user?.role === 'advisor') return null;

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" /> Create Session & QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Club Session / Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Session Title</Label>
            <Input
              id="session-title"
              type="text"
              placeholder="e.g. Next.js 14 Fullstack Masterclass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Session Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Meeting</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon / Sprint</SelectItem>
                  <SelectItem value="standup">Wing Standup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Wing Restriction</Label>
              <Select value={teamId || '__all'} onValueChange={(v) => setTeamId(v === '__all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Wings (Open Session)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Wings (Open Session)</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-location">Location / Room</Label>
              <Input
                id="session-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-duration">Duration (Minutes)</Label>
              <Input
                id="session-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="session-desc">Description / Notes</Label>
            <Input
              id="session-desc"
              type="text"
              placeholder="Topic outline, prerequisites, room details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
              {isSubmitting ? 'Creating...' : 'Create & Generate QR'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
