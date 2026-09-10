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

interface CreateTeamModalProps {
  onCreated?: () => void;
}

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advisors are view-only.
  if (user?.role === 'advisor') return null;

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="w-4 h-4" /> Create Team / Wing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team / Wing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              type="text"
              placeholder="e.g. Web Development Wing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-code">Team Code (Short Identifier)</Label>
            <Input
              id="team-code"
              type="text"
              placeholder="e.g. WEB"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={20}
              className="font-mono uppercase"
              required
            />
            <p className="text-[11px] text-muted-foreground">Stored in uppercase. Must be unique across all wings.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description (Optional)</Label>
            <Input
              id="team-desc"
              type="text"
              placeholder="What this wing focuses on..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Team Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all focus-orange ${
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
                className="h-7 w-7 rounded-full cursor-pointer bg-transparent border border-border focus-orange"
                title="Custom color"
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
