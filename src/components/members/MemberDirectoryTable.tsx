'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Shield, User, Filter, Edit2, X, Trash2 } from 'lucide-react';

interface MemberDirectoryProps {
  members: Array<{
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    position: string;
    role: 'admin' | 'user';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
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
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member, roll, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-transparent border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all shadow-sm"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-transparent border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-sm shadow-sm"
          >
            <option value="ALL">All Club Wings</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="dash-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-muted-foreground border-b border-border font-medium">
              <tr>
                <th className="p-4 font-semibold">Member</th>
                <th className="p-4 font-semibold">Bennett Email & Roll</th>
                <th className="p-4 font-semibold">Position / Title</th>
                <th className="p-4 font-semibold">Wing</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Attended</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-foreground text-sm">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="font-semibold text-foreground">{member.name}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-foreground font-medium">{member.rollNumber}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{member.email}</div>
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-medium text-[11px]">
                      {member.position || 'Member'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-foreground">{member.teamName}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                        member.role === 'admin'
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'bg-secondary text-muted-foreground border border-border'
                      }`}
                    >
                      {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-foreground tabular-nums">{member.totalAttended} check-ins</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      title="Edit Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role, Position & Wing Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4 anim-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Edit Member Assignment</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Updating details for <strong className="text-foreground">{editingUser.name}</strong> ({editingUser.rollNumber})
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-transparent border border-input text-foreground font-medium outline-none focus:ring-1 focus:ring-ring shadow-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Position / Designation</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-transparent border border-input text-foreground font-medium outline-none focus:ring-1 focus:ring-ring shadow-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Role Permission</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-transparent border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                >
                  <option value="user">User (Club Member)</option>
                  <option value="admin">Admin (Executive / Lead)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Assigned Wing / Team</label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-transparent border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isUpdating}
                className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex gap-2 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

