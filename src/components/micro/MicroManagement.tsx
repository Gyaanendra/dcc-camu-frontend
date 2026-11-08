'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  CalendarCheck,
  BarChart3,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Shield,
  Trash2,
  Edit2,
  UserPlus,
  Layers,
  ChevronDown,
  Search,
  ExternalLink,
  Crown,
  AlertCircle,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  code: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  sessionCount?: number;
  teamCount?: number;
  memberCount?: number;
}

interface SessionItem {
  id: string;
  eventId: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  isActive: string;
}

interface TeamMember {
  id: string;
  userId: string;
  roleInTeam: 'leader' | 'member' | 'volunteer';
  name: string;
  rollNumber: string;
  academicYear: string;
  email: string;
  avatarUrl?: string | null;
  position: string;
}

interface MicroTeam {
  id: string;
  eventId: string;
  name: string;
  code: string;
  isLeadershipManaged: number;
  description?: string;
  leaderId?: string | null;
  leader?: {
    id: string;
    name: string;
    rollNumber: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  memberCount: number;
  members: TeamMember[];
  assignedSessionIds: string[];
  assignedSessions?: SessionItem[];
}

interface UserDirectoryItem {
  id: string;
  name: string;
  rollNumber: string;
  academicYear?: string;
  email: string;
  avatarUrl?: string | null;
  position: string;
  role: string;
}

export const MicroManagement: React.FC = () => {
  // Main Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teams' | 'dignitary' | 'sessions'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [teams, setTeams] = useState<MicroTeam[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserDirectoryItem[]>([]);

  // Modals & Drawers
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showAutoDistributeModal, setShowAutoDistributeModal] = useState(false);
  const [memberManageTeam, setMemberManageTeam] = useState<MicroTeam | null>(null);
  const [sessionManageTeam, setSessionManageTeam] = useState<MicroTeam | null>(null);

  // Dignitary Attendance State
  const [dignitarySessionId, setDignitarySessionId] = useState<string>('');
  const [dignitaryAttendance, setDignitaryAttendance] = useState<
    Record<string, { status: 'present' | 'late' | 'absent' | 'excused'; notes: string }>
  >({});
  const [submittingDignitary, setSubmittingDignitary] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', code: '', description: '', status: 'active' });
  const [sessionForm, setSessionForm] = useState({ title: '', location: 'Auditorium / Main Hall', startTime: '', endTime: '', isActive: true });
  const [teamForm, setTeamForm] = useState({ name: '', code: '', leaderId: '', isLeadershipManaged: false, description: '' });
  const [autoDistributeForm, setAutoDistributeForm] = useState({ teamPrefix: 'Micro-Team', teamSize: 5 });

  // Member search in modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // 1. Fetch initial events & directory
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [eventsRes, usersRes] = await Promise.all([
        api.getMicroEvents(),
        api.getUsers().catch(() => ({ users: [] })),
      ]);

      const evtList: EventItem[] = eventsRes.events || [];
      setEvents(evtList);

      const uList = usersRes.users || usersRes || [];
      setAllUsers(uList);

      if (evtList.length > 0) {
        const activeEvt = evtList.find((e) => e.status === 'active') || evtList[0];
        setActiveEventId(activeEvt.id);
        await loadEventDetails(activeEvt.id);
      }
    } catch (err: any) {
      console.error('Failed to load micro-management data:', err);
      toast.error(err.message || 'Failed to initialize micro-management');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch specific event details & dashboard
  const loadEventDetails = async (eventId: string) => {
    if (!eventId) return;
    try {
      setRefreshing(true);
      const [evtRes, teamsRes, dashRes] = await Promise.all([
        api.getMicroEvent(eventId),
        api.getMicroTeams(eventId),
        api.getMicroDashboard(eventId).catch(() => null),
      ]);

      setSessions(evtRes.sessions || []);
      setTeams(teamsRes.teams || []);
      setDashboardData(dashRes);

      if (evtRes.sessions && evtRes.sessions.length > 0 && !dignitarySessionId) {
        setDignitarySessionId(evtRes.sessions[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load event details:', err);
      toast.error('Failed to refresh event data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleEventSwitch = (eventId: string) => {
    setActiveEventId(eventId);
    loadEventDetails(eventId);
  };

  const activeEvent = events.find((e) => e.id === activeEventId);
  const dignitaryTeam = teams.find((t) => t.isLeadershipManaged === 1);
  const regularTeams = teams.filter((t) => t.isLeadershipManaged !== 1);

  // Sync Dignitary attendance state when session or team changes
  useEffect(() => {
    if (dignitaryTeam && dignitarySessionId) {
      // Fetch status for this session
      api.getMyMicroTeams({ eventId: activeEventId, sessionId: dignitarySessionId }).then((res) => {
        const dig = res.teams?.find((t: any) => t.id === dignitaryTeam.id);
        if (dig) {
          const nextState: any = {};
          dig.members?.forEach((m: any) => {
            nextState[m.userId] = {
              status: m.attendance?.status || 'present',
              notes: m.attendance?.notes || '',
            };
          });
          setDignitaryAttendance(nextState);
        }
      });
    }
  }, [dignitarySessionId, dignitaryTeam?.id]);

  // Export CSV Action
  const handleExportCsv = async () => {
    if (!activeEventId) return;
    try {
      toast.info('Generating RFC 4180 CSV Export...');
      await api.downloadMicroAttendanceCsv(activeEventId, `summit_attendance_${activeEvent?.code || 'event'}.csv`);
      toast.success('Attendance CSV downloaded successfully!');
    } catch (err: any) {
      console.error('CSV export failed:', err);
      toast.error(err.message || 'Failed to export CSV');
    }
  };

  // Create Event Action
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.code) {
      toast.error('Title and Code are required');
      return;
    }
    try {
      const res = await api.createMicroEvent(eventForm);
      toast.success('Event created successfully');
      setShowCreateEventModal(false);
      setEventForm({ title: '', code: '', description: '', status: 'active' });
      await loadInitialData();
      if (res.event?.id) {
        setActiveEventId(res.event.id);
        await loadEventDetails(res.event.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  // Create Session Action
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Please enter session title, start time, and end time');
      return;
    }
    try {
      await api.createMicroSession(activeEventId, sessionForm);
      toast.success('Session added successfully');
      setShowCreateSessionModal(false);
      setSessionForm({ title: '', location: 'Auditorium / Main Hall', startTime: '', endTime: '', isActive: true });
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session');
    }
  };

  // Delete Session Action
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.deleteMicroSession(sessionId);
      toast.success('Session deleted');
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete session');
    }
  };

  // Create Micro-Team Action
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.code) {
      toast.error('Team name and code are required');
      return;
    }
    try {
      await api.createMicroTeam(activeEventId, {
        name: teamForm.name,
        code: teamForm.code,
        leaderId: teamForm.leaderId || null,
        isLeadershipManaged: teamForm.isLeadershipManaged,
        description: teamForm.description,
      });
      toast.success('Micro-team created successfully');
      setShowCreateTeamModal(false);
      setTeamForm({ name: '', code: '', leaderId: '', isLeadershipManaged: false, description: '' });
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create team');
    }
  };

  // Delete Micro-Team Action
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this micro-team? Members will become unassigned from this team.')) return;
    try {
      await api.deleteMicroTeam(teamId);
      toast.success('Team deleted');
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  // Auto-Distribute Action
  const handleAutoDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.info('Distributing members into micro-teams...');
      const res = await api.autoDistributeMicroTeams(activeEventId, {
        teamPrefix: autoDistributeForm.teamPrefix,
        teamSize: Number(autoDistributeForm.teamSize),
      });
      toast.success(res.message || 'Micro-teams generated successfully!');
      setShowAutoDistributeModal(false);
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-distribute members');
    }
  };

  // Member Allocation Helpers
  const handleAddMemberToTeam = async (userId: string, roleInTeam: 'leader' | 'member' | 'volunteer' = 'member') => {
    if (!memberManageTeam) return;
    try {
      await api.addMicroTeamMembers(memberManageTeam.id, [{ userId, roleInTeam }]);
      toast.success('Member added to team');
      // Refresh teams
      const updatedTeams = await api.getMicroTeams(activeEventId);
      setTeams(updatedTeams.teams || []);
      const ref = updatedTeams.teams?.find((t: MicroTeam) => t.id === memberManageTeam.id);
      if (ref) setMemberManageTeam(ref);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMemberFromTeam = async (userId: string) => {
    if (!memberManageTeam) return;
    try {
      await api.removeMicroTeamMember(memberManageTeam.id, userId);
      toast.success('Member removed');
      const updatedTeams = await api.getMicroTeams(activeEventId);
      setTeams(updatedTeams.teams || []);
      const ref = updatedTeams.teams?.find((t: MicroTeam) => t.id === memberManageTeam.id);
      if (ref) setMemberManageTeam(ref);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  // Session Mapping Helper
  const handleToggleSessionForTeam = async (sessionId: string) => {
    if (!sessionManageTeam) return;
    const current = new Set(sessionManageTeam.assignedSessionIds || []);
    if (current.has(sessionId)) {
      current.delete(sessionId);
    } else {
      current.add(sessionId);
    }

    try {
      await api.assignMicroTeamSessions(sessionManageTeam.id, Array.from(current));
      const updatedTeams = await api.getMicroTeams(activeEventId);
      setTeams(updatedTeams.teams || []);
      const ref = updatedTeams.teams?.find((t: MicroTeam) => t.id === sessionManageTeam.id);
      if (ref) setSessionManageTeam(ref);
      toast.success('Session assignments updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update session assignments');
    }
  };

  // Dignitary Check-in Submit Action
  const handleSubmitDignitaryAttendance = async () => {
    if (!dignitaryTeam || !dignitarySessionId) {
      toast.error('Select session and ensure Dignitary team exists');
      return;
    }
    try {
      setSubmittingDignitary(true);
      const records = dignitaryTeam.members.map((m) => {
        const entry = dignitaryAttendance[m.userId] || { status: 'present', notes: '' };
        return {
          userId: m.userId,
          status: entry.status,
          notes: entry.notes || undefined,
        };
      });

      const res = await api.submitMicroAttendanceBatch({
        sessionId: dignitarySessionId,
        microTeamId: dignitaryTeam.id,
        records,
      });

      toast.success(res.message || 'Dignitary team attendance recorded');
      await loadEventDetails(activeEventId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSubmittingDignitary(false);
    }
  };

  // Filtered members for modal search
  const assignedUserIds = new Set(teams.flatMap((t) => t.members.map((m) => m.userId)));
  const searchCandidates = allUsers.filter(
    (u) =>
      u.role !== 'advisor' &&
      (u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        u.rollNumber.toLowerCase().includes(memberSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Event Bar */}
      <div className="bg-card/70 border border-border/70 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Summit Event
                </span>
                {activeEvent && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 border-accent/40 text-accent bg-accent/5"
                  >
                    {activeEvent.status}
                  </Badge>
                )}
              </div>

              {/* Event Dropdown */}
              <div className="flex items-center gap-2 mt-1">
                {events.length > 0 ? (
                  <div className="relative">
                    <select
                      value={activeEventId}
                      onChange={(e) => handleEventSwitch(e.target.value)}
                      className="bg-background border border-border/80 text-foreground font-bold text-base sm:text-lg rounded-lg pl-3 pr-8 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.title} ({evt.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-lg font-bold text-foreground">No Events Created Yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEventDetails(activeEventId)}
              disabled={refreshing}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!activeEventId}
              className="h-9 gap-1.5 text-xs font-semibold text-foreground border-border/80 hover:bg-accent/10"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              Export CSV
            </Button>

            <Button
              size="sm"
              onClick={() => setShowCreateEventModal(true)}
              className="h-9 gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              New Summit Event
            </Button>
          </div>
        </div>

        {/* 4 Feature Tabs */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/50 overflow-x-auto custom-scroll">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Live Dashboard
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'teams'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Micro-Teams ({regularTeams.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dignitary')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dignitary'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            Dignitary Protocol ({dignitaryTeam?.memberCount || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Sessions ({sessions.length})
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: LIVE DASHBOARD & OVERSIGHT */}
      {/* ==================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Allocated
              </span>
              <p className="text-2xl font-bold text-foreground mt-1">
                {dashboardData?.stats?.totalMembersAssigned || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">across all teams</span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Summit Sessions
              </span>
              <p className="text-2xl font-bold text-foreground mt-1">
                {dashboardData?.stats?.totalSessions || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">scheduled slots</span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Present
              </span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {dashboardData?.stats?.presentEntries || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">verified check-ins</span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Late
              </span>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {dashboardData?.stats?.lateEntries || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">delayed entries</span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                Absent
              </span>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {dashboardData?.stats?.absentEntries || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">unexcused missing</span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block">
                Attendance Rate
              </span>
              <p className="text-2xl font-bold text-accent mt-1">
                {dashboardData?.stats?.overallRate || 0}%
              </p>
              <span className="text-[10px] text-muted-foreground">participation rate</span>
            </div>
          </div>

          {/* Micro-Team Live Progress Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Team Progress & Status
              </h3>
              <span className="text-xs text-muted-foreground">
                Showing {dashboardData?.teamStats?.length || 0} teams
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardData?.teamStats?.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                          {t.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        POC: <span className="font-medium text-foreground">{t.leaderName}</span>
                      </p>
                    </div>

                    <Badge
                      className={`text-[10px] px-2 py-0.5 font-bold ${
                        t.attendanceRate >= 80
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : t.attendanceRate >= 50
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {t.attendanceRate}% Rate
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${t.attendanceRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{t.memberCount} members</span>
                      <span>
                        P: <span className="text-emerald-400 font-bold">{t.presentCount}</span> | L:{' '}
                        <span className="text-amber-400 font-bold">{t.lateCount}</span> | A:{' '}
                        <span className="text-rose-400 font-bold">{t.absentCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Absentee Watchlist Table */}
          <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Absentee Watchlist ({dashboardData?.absentMembers?.length || 0})
              </h3>
              <span className="text-xs text-muted-foreground">Members recorded as absent</span>
            </div>

            {dashboardData?.absentMembers && dashboardData.absentMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Member</th>
                      <th className="px-3 py-2">Roll Number</th>
                      <th className="px-3 py-2">Academic Year</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {dashboardData.absentMembers.map((abs: any) => (
                      <tr key={abs.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium text-foreground">{abs.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{abs.rollNumber}</td>
                        <td className="px-3 py-2 text-muted-foreground">{abs.academicYear}</td>
                        <td className="px-3 py-2 text-foreground">{abs.teamName}</td>
                        <td className="px-3 py-2 text-foreground">{abs.sessionTitle}</td>
                        <td className="px-3 py-2 italic text-muted-foreground">
                          {abs.notes || 'No remarks provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No absentees reported so far. Excellent summit participation!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: TEAM ALLOCATION MANAGER */}
      {/* ==================================================================== */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Summit Micro-Teams</h3>
              <p className="text-xs text-muted-foreground">
                Squads of ~5 members (1 second/third-year POC Leader + ~4 junior core/volunteers)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAutoDistributeModal(true)}
                className="h-8 gap-1.5 text-xs font-semibold text-accent border-accent/30 hover:bg-accent/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Distribute Members
              </Button>

              <Button
                size="sm"
                onClick={() => setShowCreateTeamModal(true)}
                className="h-8 gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                New Micro-Team
              </Button>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularTeams.map((team) => (
              <div
                key={team.id}
                className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{team.name}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        {team.code}
                      </Badge>
                    </div>
                    {team.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{team.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Leader Info */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-accent/15 text-xs">
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-accent" />
                    <span className="text-muted-foreground">POC Leader:</span>
                    <span className="font-semibold text-foreground">
                      {team.leader ? `${team.leader.name} (${team.leader.rollNumber})` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Team Roster Members Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Roster ({team.members.length} members)</span>
                    <button
                      type="button"
                      onClick={() => setMemberManageTeam(team)}
                      className="text-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Manage Roster
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {team.members.map((m) => (
                      <Badge
                        key={m.userId}
                        variant="secondary"
                        className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 text-foreground"
                      >
                        <span>{m.name}</span>
                        {m.roleInTeam === 'leader' && (
                          <span className="text-[9px] text-accent font-bold uppercase">(Leader)</span>
                        )}
                        {m.roleInTeam === 'volunteer' && (
                          <span className="text-[9px] text-purple-400 font-bold uppercase">(Vol)</span>
                        )}
                      </Badge>
                    ))}
                    {team.members.length === 0 && (
                      <span className="text-xs italic text-muted-foreground">No members assigned yet</span>
                    )}
                  </div>
                </div>

                {/* Mapped Sessions */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Deployed Sessions: <span className="font-bold text-foreground">{team.assignedSessionIds?.length || 0}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessionManageTeam(team)}
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                  >
                    Assign Sessions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DIGNITARY COORDINATION TEAM (VIP & LEADERSHIP ESCORT) */}
      {/* ==================================================================== */}
      {activeTab === 'dignitary' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Crown className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Dignitary Coordination Team
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] uppercase">
                      Admin Direct Control
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    ~25 members separately shortlisted for dignitary escort, protocol, and VIP handling.
                    Attendance is directly recorded and certified by DCC Leadership (Admins).
                  </p>
                </div>
              </div>

              {dignitaryTeam && (
                <Button
                  size="sm"
                  onClick={() => setMemberManageTeam(dignitaryTeam)}
                  className="h-8 gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Manage Protocol Team ({dignitaryTeam.members.length})
                </Button>
              )}
            </div>
          </div>

          {!dignitaryTeam ? (
            <div className="bg-card border border-border/70 rounded-xl p-8 text-center space-y-3">
              <Crown className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">No Dignitary Team Created Yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a dedicated Dignitary Coordination Team for this event to manage VIP escort attendance.
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await api.createMicroTeam(activeEventId, {
                      name: 'Dignitary Coordination Team',
                      code: 'DIGNITARY-VIP',
                      isLeadershipManaged: true,
                      description: 'VIP escort, protocol, and summit dignitary coordination.',
                    });
                    toast.success('Dignitary Coordination Team created!');
                    await loadEventDetails(activeEventId);
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to create team');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
              >
                Create Dignitary Team
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Selector for Dignitary Check-in */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Mark Session:</span>
                  <select
                    value={dignitarySessionId}
                    onChange={(e) => setDignitarySessionId(e.target.value)}
                    className="bg-background border border-border/80 text-foreground font-semibold text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextState = { ...dignitaryAttendance };
                      dignitaryTeam.members.forEach((m) => {
                        nextState[m.userId] = { status: 'present', notes: nextState[m.userId]?.notes || '' };
                      });
                      setDignitaryAttendance(nextState);
                      toast.success('Marked all protocol members Present');
                    }}
                    className="h-8 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  >
                    Mark All Present
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSubmitDignitaryAttendance}
                    disabled={submittingDignitary}
                    className="h-8 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Save Protocol Attendance
                  </Button>
                </div>
              </div>

              {/* Dignitary Members Roster Table */}
              <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Member</th>
                        <th className="px-3 py-2.5">Roll Number</th>
                        <th className="px-3 py-2.5">Year</th>
                        <th className="px-3 py-2.5">Protocol Role</th>
                        <th className="px-3 py-2.5 text-center">Attendance Status</th>
                        <th className="px-3 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {dignitaryTeam.members.map((member) => {
                        const curStatus = dignitaryAttendance[member.userId]?.status || 'present';
                        const curNotes = dignitaryAttendance[member.userId]?.notes || '';

                        return (
                          <tr key={member.userId} className="hover:bg-muted/20">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <MemberAvatar
                                  src={member.avatarUrl}
                                  name={member.name}
                                  className="w-7 h-7"
                                />
                                <span className="font-semibold text-foreground">{member.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">{member.rollNumber}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{member.academicYear}</td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                {member.roleInTeam}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-background">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDignitaryAttendance((prev) => ({
                                      ...prev,
                                      [member.userId]: { status: 'present', notes: prev[member.userId]?.notes || '' },
                                    }))
                                  }
                                  className={`px-2 py-1 text-[11px] rounded font-semibold transition-all ${
                                    curStatus === 'present'
                                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDignitaryAttendance((prev) => ({
                                      ...prev,
                                      [member.userId]: { status: 'late', notes: prev[member.userId]?.notes || '' },
                                    }))
                                  }
                                  className={`px-2 py-1 text-[11px] rounded font-semibold transition-all ${
                                    curStatus === 'late'
                                      ? 'bg-amber-500/20 text-amber-400 font-bold'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDignitaryAttendance((prev) => ({
                                      ...prev,
                                      [member.userId]: { status: 'absent', notes: prev[member.userId]?.notes || '' },
                                    }))
                                  }
                                  className={`px-2 py-1 text-[11px] rounded font-semibold transition-all ${
                                    curStatus === 'absent'
                                      ? 'bg-rose-500/20 text-rose-400 font-bold'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDignitaryAttendance((prev) => ({
                                      ...prev,
                                      [member.userId]: { status: 'excused', notes: prev[member.userId]?.notes || '' },
                                    }))
                                  }
                                  className={`px-2 py-1 text-[11px] rounded font-semibold transition-all ${
                                    curStatus === 'excused'
                                      ? 'bg-sky-500/20 text-sky-400 font-bold'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  Excused
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                placeholder="Notes..."
                                value={curNotes}
                                onChange={(e) =>
                                  setDignitaryAttendance((prev) => ({
                                    ...prev,
                                    [member.userId]: {
                                      status: prev[member.userId]?.status || 'present',
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                                className="w-32 sm:w-48 bg-background border border-border/70 rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: SESSIONS & SCHEDULE */}
      {/* ==================================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Summit Sessions & Slots</h3>
              <p className="text-xs text-muted-foreground">
                Time slots and keynotes for which micro-teams and dignitary members are marked.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowCreateSessionModal(true)}
              className="h-8 gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-foreground">{s.title}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(s.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{s.location || 'Auditorium'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                No sessions scheduled for this event yet. Click "Add Session" to create your first session slot.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE EVENT */}
      {/* ==================================================================== */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create Summit Event</h3>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Global AI Summit 2026"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Event Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GAIS-2026"
                  value={eventForm.code}
                  onChange={(e) => setEventForm({ ...eventForm, code: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Summit details, venue notes..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateEventModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE SESSION */}
      {/* ==================================================================== */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add Summit Session</h3>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day 1 - Morning Keynote & Inauguration"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium / Track A Hall"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateSessionModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  Add Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CREATE MICRO-TEAM */}
      {/* ==================================================================== */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create New Micro-Team</h3>

            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Micro-Team 01 (Track A)"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Team Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MT-01"
                  value={teamForm.code}
                  onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Assign POC / Leader (2nd or 3rd Year)
                </label>
                <select
                  value={teamForm.leaderId}
                  onChange={(e) => setTeamForm({ ...teamForm, leaderId: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select a Leader...</option>
                  {allUsers
                    .filter((u) => u.role !== 'advisor')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.rollNumber}) — {u.position}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Responsible for Stage 1 Hall check-in"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateTeamModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  Create Team
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: AUTO-DISTRIBUTE TEAMS */}
      {/* ==================================================================== */}
      {showAutoDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-foreground">Auto-Distribute Members</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically divide club members into micro-teams of ~5 members each, pairing 2nd/3rd-year leaders with junior core members.
            </p>

            <form onSubmit={handleAutoDistribute} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Team Name Prefix
                </label>
                <input
                  type="text"
                  value={autoDistributeForm.teamPrefix}
                  onChange={(e) => setAutoDistributeForm({ ...autoDistributeForm, teamPrefix: e.target.value })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
                  Target Squad Size (Members per Team)
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={autoDistributeForm.teamSize}
                  onChange={(e) => setAutoDistributeForm({ ...autoDistributeForm, teamSize: Number(e.target.value) })}
                  className="w-full bg-background border border-border/70 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Recommended: 5 members (1 POC Leader + 4 Junior Core)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAutoDistributeModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  Generate Teams Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DRAWER / MODAL 5: MANAGE TEAM MEMBERS */}
      {/* ==================================================================== */}
      {memberManageTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {memberManageTeam.name} — Member Roster
                </h3>
                <p className="text-xs text-muted-foreground">
                  {memberManageTeam.members.length} members assigned
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMemberManageTeam(null)}
                className="h-8 text-xs"
              >
                Done
              </Button>
            </div>

            {/* Current Members List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Current Assigned Members
              </span>

              {memberManageTeam.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar src={m.avatarUrl} name={m.name} className="w-7 h-7" />
                    <div>
                      <span className="font-semibold text-foreground">{m.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <span>{m.rollNumber}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                          {m.roleInTeam}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMemberFromTeam(m.userId)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              {memberManageTeam.members.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 italic text-center">
                  No members in this team yet. Search below to add members.
                </p>
              )}

              {/* Add Members Section */}
              <div className="pt-3 border-t border-border/50 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Add Member to Team
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search member by name or roll number..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-border/40 border border-border/50 rounded-lg">
                  {searchCandidates.slice(0, 15).map((candidate) => {
                    const isAlreadyInTeam = memberManageTeam.members.some((m) => m.userId === candidate.id);
                    return (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-2 text-xs hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <MemberAvatar src={candidate.avatarUrl} name={candidate.name} className="w-6 h-6" />
                          <div>
                            <span className="font-semibold text-foreground">{candidate.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                              ({candidate.rollNumber})
                            </span>
                          </div>
                        </div>

                        {isAlreadyInTeam ? (
                          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5">
                            Added
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMemberToTeam(candidate.id, 'member')}
                              className="h-6 text-[10px] px-2 font-semibold"
                            >
                              + Member
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMemberToTeam(candidate.id, 'leader')}
                              className="h-6 text-[10px] px-2 font-semibold text-accent"
                            >
                              + Leader
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: MAP SESSIONS TO TEAM */}
      {/* ==================================================================== */}
      {sessionManageTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {sessionManageTeam.name} — Assign Sessions
                </h3>
                <p className="text-xs text-muted-foreground">Select sessions this micro-team will attend</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSessionManageTeam(null)}
                className="h-8 text-xs"
              >
                Done
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.map((ses) => {
                const isAssigned = sessionManageTeam.assignedSessionIds?.includes(ses.id);
                return (
                  <button
                    key={ses.id}
                    type="button"
                    onClick={() => handleToggleSessionForTeam(ses.id)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                      isAssigned
                        ? 'bg-accent/15 border-accent/40 text-foreground font-semibold'
                        : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-foreground">{ses.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {ses.location} • {new Date(ses.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isAssigned && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                );
              })}

              {sessions.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No sessions exist in this event yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
