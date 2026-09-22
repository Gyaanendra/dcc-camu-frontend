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
  const [targetAudience, setTargetAudience] = useState<'all' | 'heads_only' | 'teams_only'>('all');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [location, setLocation] = useState('Bennett CS Auditorium (Room 301)');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advisors are view-only.
  if (user?.role === 'advisor') return null;

  const toggleTeamSelection = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Please enter a session title');
      return;
    }

    if (targetAudience === 'teams_only' && selectedTeamIds.length === 0) {
      toast.error('Please select at least one required wing for this meeting');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSession({
        title,
        type,
        description,
        targetAudience,
        targetTeamIds: targetAudience === 'teams_only' ? selectedTeamIds : [],
        teamId: targetAudience === 'teams_only' ? selectedTeamIds[0] || null : null,
        location,
        durationMinutes,
      });

      toast.success(
        targetAudience === 'heads_only'
          ? 'Heads-only session created with dynamic QR token'
          : targetAudience === 'teams_only'
          ? 'Wing-restricted session created with dynamic QR token'
          : 'Club session created with dynamic QR token'
      );
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setTargetAudience('all');
      setSelectedTeamIds([]);
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
              <Label>Target Audience</Label>
              <Select
                value={targetAudience}
                onValueChange={(v) => {
                  setTargetAudience(v as any);
                  if (v !== 'teams_only') setSelectedTeamIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 All Club Members</SelectItem>
                  <SelectItem value="heads_only">👑 Heads & Leads Only</SelectItem>
                  <SelectItem value="teams_only">👥 Specific Wing(s) Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetAudience === 'teams_only' && (
            <div className="space-y-2 p-3 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Select Required Wings
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {selectedTeamIds.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {teams.map((t) => {
                  const isSelected = selectedTeamIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTeamSelection(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                          : 'bg-background hover:bg-secondary text-foreground border-border'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              className="flex-1 focus-orange"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 focus-orange"
            >
              {isSubmitting ? 'Creating...' : 'Create & Generate QR'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
