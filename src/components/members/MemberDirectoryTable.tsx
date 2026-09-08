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
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search member, roll, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 dark:focus:border-zinc-700 outline-none shadow-sm transition-all"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs focus:border-slate-900 dark:focus:border-zinc-700 outline-none shadow-sm"
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
      <div className="rounded-2xl dash-card bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 font-medium">
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
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/75 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300 text-xs">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">{member.name}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-slate-900 dark:text-zinc-100 font-medium">{member.rollNumber}</div>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">{member.email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-zinc-200">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-[11px]">
                      {member.position || 'Member'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-zinc-300">{member.teamName}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                        member.role === 'admin'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-zinc-100">{member.totalAttended} check-ins</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Edit Member Assignment</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Updating details for <strong className="text-slate-900 dark:text-zinc-100">{editingUser.name}</strong> ({editingUser.rollNumber})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium outline-none focus:border-slate-900 dark:focus:border-zinc-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Position / Designation</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium outline-none focus:border-slate-900 dark:focus:border-zinc-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Role Permission (Admin Only)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm outline-none"
                >
                  <option value="user">User (Club Member)</option>
                  <option value="admin">Admin (Executive / Lead)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Assigned Wing / Team</label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm outline-none"
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

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isUpdating}
                className="p-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex gap-2 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-colors"
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

