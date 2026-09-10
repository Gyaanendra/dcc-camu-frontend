'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { generateClientNotionistAvatar } from '@/lib/avatar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserPlus, Dices } from 'lucide-react';
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
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarUrl, setAvatarUrl] = useState(() => generateClientNotionistAvatar(undefined, 'male'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advisors are view-only — never show the create control to them.
  if (user?.role === 'advisor') return null;

  const handleShuffleAvatar = () => {
    setAvatarUrl(generateClientNotionistAvatar(rollNumber || name, gender));
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRollNumber('');
    setPosition('Member');
    setTeamId('');
    setRole('user');
    setGender('male');
    setAvatarUrl(generateClientNotionistAvatar(undefined, 'male'));
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
        avatarUrl,
      });

      toast.success(`Member "${name.trim()}" added successfully with gender-matched avatar`);
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open && !avatarUrl) {
        setAvatarUrl(generateClientNotionistAvatar(undefined, gender));
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        {/* Funky Notionist Avatar Preview Card with Gender Switch */}
        <div className="flex items-center gap-3 p-3 bg-secondary/40 border border-border rounded-lg">
          <Avatar className="h-14 w-14 border border-border shrink-0">
            <AvatarImage src={avatarUrl} alt="Notionist Avatar Preview" />
            <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
              {name ? name.charAt(0).toUpperCase() : 'N'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Funky Notionist Avatar
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">gender-matched</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  setAvatarUrl(generateClientNotionistAvatar(rollNumber || name, 'male'));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  gender === 'male'
                    ? 'bg-primary text-primary-foreground border-primary focus-orange'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                👦 Male
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  setAvatarUrl(generateClientNotionistAvatar(rollNumber || name, 'female'));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  gender === 'female'
                    ? 'bg-primary text-primary-foreground border-primary focus-orange'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                👧 Female
              </button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShuffleAvatar}
            className="h-8 text-xs gap-1.5 shrink-0 focus-orange"
            title="Shuffle avatar with current gender"
          >
            <Dices className="w-3.5 h-3.5" /> Shuffle
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              type="text"
              placeholder="e.g. Rohan Gupta"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
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
              className="flex-1 focus-orange"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 focus-orange"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
