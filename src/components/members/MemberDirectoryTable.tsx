'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Shield,
  User,
  Edit2,
  Trash2,
  Eye,
  Dices,
  Loader2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
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
    teamId: string | null;
    teamName: string;
    teamCode: string;
    totalAttended: number;
    avatarUrl?: string;
  }>;
  teams: Array<{ id: string; name: string }>;
  onRefresh?: () => void;
}

type SortField = 'name' | 'rollNumber' | 'position' | 'teamName' | 'role' | 'totalAttended';
type SortDirection = 'asc' | 'desc';

export const MemberDirectoryTable: React.FC<MemberDirectoryProps> = ({ members, teams, onRefresh }) => {
  const { user: currentUser } = useAuth();
  const isReadOnly = currentUser?.role === 'advisor';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'admin' | 'advisor' | 'user'>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'ACTIVE' | 'ZERO'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Edit / Avatar re-roll states
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'advisor' | 'user'>('user');
  const [newPosition, setNewPosition] = useState<string>('Member');
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [rerollingId, setRerollingId] = useState<string | null>(null);
  const [isRandomizingAll, setIsRandomizingAll] = useState(false);

  // Exact Role Counts across DB
  const totalCount = members.length;
  const userCount = useMemo(() => members.filter((m) => m.role === 'user').length, [members]);
  const adminCount = useMemo(() => members.filter((m) => m.role === 'admin').length, [members]);
  const advisorCount = useMemo(() => members.filter((m) => m.role === 'advisor').length, [members]);

  // Filtering + Sorting Computation
  const sortedAndFilteredMembers = useMemo(() => {
    const filtered = members.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.rollNumber.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q)) ||
        (m.teamName && m.teamName.toLowerCase().includes(q));

      const matchesRole = selectedRoleFilter === 'ALL' || m.role === selectedRoleFilter;
      const matchesTeam = selectedTeamFilter === 'ALL' || m.teamId === selectedTeamFilter;
      const matchesAttendance =
        attendanceFilter === 'ALL'
          ? true
          : attendanceFilter === 'ACTIVE'
          ? m.totalAttended > 0
          : m.totalAttended === 0;

      return matchesSearch && matchesRole && matchesTeam && matchesAttendance;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'rollNumber') {
        comparison = a.rollNumber.localeCompare(b.rollNumber);
      } else if (sortField === 'position') {
        comparison = (a.position || 'Member').localeCompare(b.position || 'Member');
      } else if (sortField === 'teamName') {
        comparison = (a.teamName || '').localeCompare(b.teamName || '');
      } else if (sortField === 'role') {
        const roleRank: Record<string, number> = { admin: 1, advisor: 2, user: 3 };
        comparison = (roleRank[a.role] || 99) - (roleRank[b.role] || 99);
      } else if (sortField === 'totalAttended') {
        comparison = a.totalAttended - b.totalAttended;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [members, searchTerm, selectedRoleFilter, selectedTeamFilter, attendanceFilter, sortField, sortDirection]);

  // Handle header column click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'totalAttended' ? 'desc' : 'asc');
    }
  };

  // Reset all filters
  const hasActiveFilters = searchTerm !== '' || selectedRoleFilter !== 'ALL' || selectedTeamFilter !== 'ALL' || attendanceFilter !== 'ALL';
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('ALL');
    setSelectedTeamFilter('ALL');
    setAttendanceFilter('ALL');
    setSortField('name');
    setSortDirection('asc');
  };

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

  const handleRerollAvatar = async (memberId: string, memberName: string, gender?: 'male' | 'female') => {
    if (isReadOnly) return;
    setRerollingId(memberId);
    try {
      const res = await api.rerollMemberAvatar(memberId, gender);
      toast.success(`New gender-matched Notionist avatar generated for ${memberName}!`);
      if (editingUser && editingUser.id === memberId) {
        setEditingUser((prev: any) => ({ ...prev, avatarUrl: res.avatarUrl }));
      }
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to re-roll avatar');
    } finally {
      setRerollingId(null);
    }
  };

  const handleRandomizeAll = async () => {
    if (isReadOnly) return;
    if (!window.confirm('Re-roll funky Notionist avatars for all members in the club?')) return;
    setIsRandomizingAll(true);
    try {
      const res = await api.randomizeAllAvatars(true);
      toast.success(res.message || 'Randomized Notionist avatars for all members!');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to randomize avatars');
    } finally {
      setIsRandomizingAll(false);
    }
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

  // Quick preset sort string for the dropdown
  const sortValue = `${sortField}-${sortDirection}`;
  const handleSortDropdownChange = (val: string) => {
    const [field, dir] = val.split('-') as [SortField, SortDirection];
    setSortField(field);
    setSortDirection(dir);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Role Count Quick-Filter Cards ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Roster Card */}
        <Card
          onClick={() => setSelectedRoleFilter('ALL')}
          className={`p-4 cursor-pointer transition-all duration-150 hover:border-primary/50 ${
            selectedRoleFilter === 'ALL'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
              : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Roster
            </span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">All registered users</p>
        </Card>

        {/* Club Members Card */}
        <Card
          onClick={() => setSelectedRoleFilter('user')}
          className={`p-4 cursor-pointer transition-all duration-150 hover:border-accent/50 ${
            selectedRoleFilter === 'user'
              ? 'border-accent ring-2 ring-accent/20 bg-accent/5'
              : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Members
            </span>
            <User className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {userCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Club executives & leads</p>
        </Card>

        {/* Admins Card */}
        <Card
          onClick={() => setSelectedRoleFilter('admin')}
          className={`p-4 cursor-pointer transition-all duration-150 hover:border-accent/50 ${
            selectedRoleFilter === 'admin'
              ? 'border-accent ring-2 ring-accent/20 bg-accent/5'
              : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admins
            </span>
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {adminCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">System administrators</p>
        </Card>

        {/* Advisors Card */}
        <Card
          onClick={() => setSelectedRoleFilter('advisor')}
          className={`p-4 cursor-pointer transition-all duration-150 hover:border-amber-500/50 ${
            selectedRoleFilter === 'advisor'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
              : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Advisors
            </span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {advisorCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Faculty / view-only advisors</p>
        </Card>
      </div>

      {/* ── 2. Comprehensive Controls & Filters Bar ───────────────── */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, roll number, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 font-mono text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground focus-orange rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Sorting */}
          {/* Role Filter */}
          <Select
            value={selectedRoleFilter}
            onValueChange={(val) => setSelectedRoleFilter(val as any)}
          >
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles ({totalCount})</SelectItem>
              <SelectItem value="user">Members ({userCount})</SelectItem>
              <SelectItem value="admin">Admins ({adminCount})</SelectItem>
              <SelectItem value="advisor">Advisors ({advisorCount})</SelectItem>
            </SelectContent>
          </Select>

          {/* Wing / Team Filter */}
          <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
            <SelectTrigger className="w-[155px] text-xs h-9">
              <SelectValue placeholder="All Club Wings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Club Wings</SelectItem>
              {teams.map((t) => {
                const count = members.filter((m) => m.teamId === t.id).length;
                return (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Attendance Activity Filter */}
          <Select
            value={attendanceFilter}
            onValueChange={(val) => setAttendanceFilter(val as any)}
          >
            <SelectTrigger className="w-[145px] text-xs h-9">
              <SelectValue placeholder="All Check-ins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Check-ins</SelectItem>
              <SelectItem value="ACTIVE">Has Check-ins (≥1)</SelectItem>
              <SelectItem value="ZERO">0 Check-ins</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Dropdown */}
          <Select value={sortValue} onValueChange={handleSortDropdownChange}>
            <SelectTrigger className="w-[170px] text-xs h-9">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A → Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z → A)</SelectItem>
              <SelectItem value="rollNumber-asc">Roll (Ascending)</SelectItem>
              <SelectItem value="rollNumber-desc">Roll (Descending)</SelectItem>
              <SelectItem value="role-asc">Role (Admin → Member)</SelectItem>
              <SelectItem value="role-desc">Role (Member → Admin)</SelectItem>
              <SelectItem value="totalAttended-desc">Check-ins (High → Low)</SelectItem>
              <SelectItem value="totalAttended-asc">Check-ins (Low → High)</SelectItem>
              <SelectItem value="teamName-asc">Wing (A → Z)</SelectItem>
              <SelectItem value="position-asc">Position (A → Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk Randomize Avatars (Admin only) */}
          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomizeAll}
              disabled={isRandomizingAll}
              className="gap-1.5 text-xs h-9 shrink-0"
              title="Randomize funky Notionist avatars for all members"
            >
              {isRandomizingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Dices className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Randomize Avatars</span>
            </Button>
          )}
          <span className="ml-auto font-mono text-[12px] text-muted-foreground tabular-nums">
            {sortedAndFilteredMembers.length} of {totalCount}
          </span>
      </div>

      {/* Filter Status & Reset Action */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-secondary/40 border border-border px-3 py-2 rounded-md text-xs">
          <div className="text-muted-foreground">
            Showing <strong className="text-foreground">{sortedAndFilteredMembers.length}</strong> of{' '}
            <strong className="text-foreground">{totalCount}</strong> people
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 focus-orange"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all filters
          </Button>
        </div>
      )}

      {/* ── 3. Directory Table with Clickable Sort Headers ────────── */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-auto max-h-[60vh] table-sticky-head">
          <table className="w-full caption-bottom text-sm">
          <TableHeader className="bg-secondary/60">
            <TableRow className="hover:bg-transparent">
              {/* Member Name */}
              <TableHead
                onClick={() => handleSort('name')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Member</span>
                  {sortField === 'name' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {/* Bennett Email & Roll */}
              <TableHead
                onClick={() => handleSort('rollNumber')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bennett Email & Roll</span>
                  {sortField === 'rollNumber' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {/* Position / Title */}
              <TableHead
                onClick={() => handleSort('position')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Position / Title</span>
                  {sortField === 'position' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {/* Wing */}
              <TableHead
                onClick={() => handleSort('teamName')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Wing</span>
                  {sortField === 'teamName' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {/* Role */}
              <TableHead
                onClick={() => handleSort('role')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Role</span>
                  {sortField === 'role' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {/* Attended */}
              <TableHead
                onClick={() => handleSort('totalAttended')}
                className="text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Attended</span>
                  {sortField === 'totalAttended' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </TableHead>

              {!isReadOnly && (
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isReadOnly ? 6 : 7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-6 h-6 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No people found matching your criteria.</p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-xs mt-1 focus-orange"
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border hover:scale-110 transition-transform duration-200 shrink-0">
                        {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                        <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-foreground">{member.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-[13px] text-foreground font-medium">{member.rollNumber}</div>
                    <div className="font-mono text-[13px] text-muted-foreground max-w-[180px] truncate" title={member.email}>{member.email}</div>
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
                      {member.role === 'admin' ? (
                        <Shield className="w-3 h-3 mr-1" />
                      ) : member.role === 'advisor' ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-foreground tabular-nums">
                    {member.totalAttended} check-ins
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRerollAvatar(member.id, member.name)}
                          disabled={rerollingId === member.id}
                          title="Re-roll funky Notionist avatar"
                        >
                          <Dices className={`w-3.5 h-3.5 ${rerollingId === member.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(member)}
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
          </table>
        </div>
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

          {/* Member Avatar with Re-roll & Gender Switch */}
          {editingUser && (
            <div className="flex items-center gap-3 p-3 bg-secondary/40 border border-border rounded-lg">
              <Avatar className="h-14 w-14 border border-border shrink-0">
                {editingUser.avatarUrl && <AvatarImage src={editingUser.avatarUrl} alt={editingUser.name} />}
                <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                  {editingUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground">Funky Notionist Avatar</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleRerollAvatar(editingUser.id, editingUser.name, 'male')}
                    disabled={rerollingId === editingUser.id}
                    className="px-2 py-0.5 rounded text-[11px] font-medium border bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    👦 Male
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRerollAvatar(editingUser.id, editingUser.name, 'female')}
                    disabled={rerollingId === editingUser.id}
                    className="px-2 py-0.5 rounded text-[11px] font-medium border bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    👧 Female
                  </button>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRerollAvatar(editingUser.id, editingUser.name)}
                disabled={rerollingId === editingUser.id}
                className="h-8 text-xs gap-1.5 shrink-0"
                title="Shuffle Notionist avatar"
              >
                <Dices className={`w-3.5 h-3.5 ${rerollingId === editingUser.id ? 'animate-spin' : ''}`} />
                Shuffle
              </Button>
            </div>
          )}

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
