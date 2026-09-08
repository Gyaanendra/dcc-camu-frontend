'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Search, Shield, User, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MemberDirectoryProps {
  members: Array<{
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    position: string;
    role: 'admin' | 'advisor' | 'user';
    teamId?: string | null;
    teamName: string;
    teamCode: string;
    totalAttended: number;
    avatarUrl?: string;
  }>;
  teams: Array<{ id: string; name: string }>;
  onRefresh?: () => void;
}

export const MemberDirectoryTable: React.FC<MemberDirectoryProps> = ({ members, teams, onRefresh }) => {
  const { user: currentUser } = useAuth();
  const isReadOnly = currentUser?.role === 'advisor';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'advisor' | 'user'>('user');
  const [newPosition, setNewPosition] = useState<string>('Member');
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeam = selectedTeamFilter === 'ALL' || m.teamId === selectedTeamFilter;

    return matchesSearch && matchesTeam;
  });

  const handleOpenEdit = (user: any) => {
    if (isReadOnly) {
      toast.error('Advisors have view-only access.');
      return;
    }
    setEditingUser(user);
    setNewName(user.name);
    setNewRole(user.role);
    setNewPosition(user.position || 'Member');
    setNewTeamId(user.teamId || '');
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await api.updateUserRole(editingUser.id, {
        name: newName.trim(),
        role: newRole,
        position: newPosition,
        teamId: newTeamId || null,
      });
      toast.success(`Updated details for ${newName.trim() || editingUser.name}`);
      setEditingUser(null);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    if (!window.confirm(`Are you sure you want to remove ${editingUser.name} (${editingUser.rollNumber})? This cannot be undone.`)) return;
    setIsUpdating(true);
    try {
      await api.deleteUser(editingUser.id);
      toast.success(`Removed ${editingUser.name}`);
      setEditingUser(null);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search member, roll, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Club Wings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Club Wings</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Directory Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader className="bg-secondary/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Member</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Bennett Email & Roll</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Position / Title</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Wing</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Role</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Attended</TableHead>
              {!isReadOnly && <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                      <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-semibold text-foreground">{member.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-foreground font-medium">{member.rollNumber}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{member.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    {member.position || 'Member'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-foreground">{member.teamName}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      member.role === 'admin'
                        ? 'bg-accent/10 text-accent border-accent/20 font-mono text-[10px] font-bold uppercase tracking-wider'
                        : member.role === 'advisor'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-mono text-[10px] font-bold uppercase tracking-wider'
                          : 'font-mono text-[10px] font-bold uppercase tracking-wider'
                    }
                  >
                    {member.role === 'admin' ? <Shield className="w-3 h-3" /> : member.role === 'advisor' ? <Eye className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-foreground tabular-nums">{member.totalAttended} check-ins</TableCell>
                {!isReadOnly && (
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(member)}
                      title="Edit Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Role, Position & Wing Dialog (admins only) */}
      <Dialog open={!!editingUser && !isReadOnly} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Assignment</DialogTitle>
            {editingUser && (
              <DialogDescription>
                Updating details for <strong className="text-foreground">{editingUser.name}</strong> ({editingUser.rollNumber})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-position">Position / Designation</Label>
              <Input
                id="edit-position"
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role Permission</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
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

            <div className="space-y-1.5">
              <Label>Assigned Wing / Team</Label>
              <Select value={newTeamId || '__unassigned'} onValueChange={(v) => setNewTeamId(v === '__unassigned' ? '' : v)}>
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
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDeleteUser}
              disabled={isUpdating}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Remove Member"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveRole}
                disabled={isUpdating}
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
