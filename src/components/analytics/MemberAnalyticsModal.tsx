'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Building,
  GraduationCap,
} from 'lucide-react';
import { getAcademicYear, getYearBadgeColor } from '@/lib/academic-year';

interface MemberAnalyticsModalProps {
  member: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberAnalyticsModal: React.FC<MemberAnalyticsModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  if (!member) return null;

  const academicYear = member.academicYear || getAcademicYear(member.rollNumber);
  const rate = member.attendancePercentage ?? (member.eligibleSessions ? Math.round(((member.attendedSessions || member.totalAttended || 0) / member.eligibleSessions) * 100) : 100);
  const isAtRisk = member.isAtRisk || (rate < 75 && member.role !== 'advisor');
  const onTime = member.onTimeCount ?? (member.totalAttended || 0);
  const late = member.lateCount ?? 0;
  const attended = member.attendedSessions ?? member.totalAttended ?? 0;
  const eligible = member.eligibleSessions ?? member.totalSessions ?? 0;
  const missed = Math.max(0, eligible - attended);
  const punctuality = member.punctualityRate ?? (attended > 0 ? Math.round((onTime / attended) * 100) : 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-muted/20 border-b border-border/60">
          <div className="flex items-start gap-4">
            <MemberAvatar
              src={member.avatarUrl}
              name={member.name}
              className="h-16 w-16 rounded-xl border-2 border-border shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground truncate">{member.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${getYearBadgeColor(
                    academicYear as any
                  )}`}
                >
                  {academicYear}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground">{member.rollNumber}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {member.teamName || 'General Wing'}
                </Badge>
                <span>•</span>
                <span className="capitalize">{member.position || member.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content & Metrics */}
        <div className="p-6 space-y-5">
          {/* Risk Alert if < 75% */}
          {isAtRisk && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <strong className="font-semibold">At-Risk Member Alert:</strong> Attendance is below
                the 75% university eligibility requirement.
              </div>
            </div>
          )}

          {/* Primary Attendance Rate Display */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/80">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall Attendance Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {rate}%
                </span>
                <Badge
                  variant="outline"
                  className={
                    rate >= 75
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : rate >= 60
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-destructive/10 text-destructive border-destructive/30'
                  }
                >
                  {rate >= 75 ? 'Qualified (Safe)' : rate >= 60 ? 'Warning Zone' : 'Critical Deficit'}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-muted-foreground">Punctuality Score</span>
              <div className="text-xl font-bold text-foreground tabular-nums mt-1">
                {punctuality}%
              </div>
              <span className="text-[11px] text-muted-foreground">on-time ratio</span>
            </div>
          </div>

          {/* Detailed Counts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-500 text-xs font-medium">
                <span>On-Time</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold text-emerald-500 tabular-nums mt-1">
                {onTime}
              </div>
              <span className="text-[10px] text-muted-foreground">scanned on time</span>
            </Card>

            <Card className="p-3 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center justify-between text-amber-500 text-xs font-medium">
                <span>Late Arrivals</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold text-amber-500 tabular-nums mt-1">
                {late}
              </div>
              <span className="text-[10px] text-muted-foreground">marked after cutoff</span>
            </Card>

            <Card className="p-3 bg-card">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Eligible Sessions</span>
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold text-foreground tabular-nums mt-1">
                {eligible}
              </div>
              <span className="text-[10px] text-muted-foreground">targeted for year/wing</span>
            </Card>

            <Card className="p-3 bg-destructive/5 border-destructive/20">
              <div className="flex items-center justify-between text-destructive text-xs font-medium">
                <span>Missed / Absent</span>
                <XCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold text-destructive tabular-nums mt-1">
                {missed}
              </div>
              <span className="text-[10px] text-muted-foreground">sessions unattended</span>
            </Card>
          </div>

          {/* Extra Info */}
          <div className="text-xs text-muted-foreground space-y-1.5 pt-1 border-t border-border/60">
            <div className="flex justify-between">
              <span>Bennett Email</span>
              <span className="font-mono text-foreground">{member.email}</span>
            </div>
            {member.lastActive && (
              <div className="flex justify-between">
                <span>Last Activity</span>
                <span className="text-foreground">
                  {new Date(member.lastActive).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
