'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminODApprovalsPage() {
  const [ods, setOds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Review Dialog State
  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    odId: string | null;
    status: 'approved' | 'rejected';
    memberName: string;
    notes: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    odId: null,
    status: 'approved',
    memberName: '',
    notes: '',
    isSubmitting: false,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminODs();
      setOds(data || []);
    } catch (err: any) {
      toast.error('Failed to load OD records: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewModal = (od: any, status: 'approved' | 'rejected') => {
    setReviewDialog({
      isOpen: true,
      odId: od.id,
      status,
      memberName: od.user?.name || 'Member',
      notes: status === 'approved' ? 'Approved for CAMU credit sanction.' : '',
      isSubmitting: false,
    });
  };

  const handleConfirmReview = async () => {
    if (!reviewDialog.odId) return;

    setReviewDialog((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await api.updateODStatus(reviewDialog.odId, {
        status: reviewDialog.status,
        adminNotes: reviewDialog.notes.trim() || undefined,
      });
      toast.success(`OD request ${reviewDialog.status} successfully`);
      setReviewDialog((prev) => ({ ...prev, isOpen: false }));
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update OD status');
    } finally {
      setReviewDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const filteredOds = ods.filter((od) => {
    if (statusFilter !== 'all' && od.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (od.user?.name || '').toLowerCase();
      const roll = (od.user?.rollNumber || '').toLowerCase();
      const reason = (od.reason || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || reason.includes(q);
    }
    return true;
  });

  const pendingCount = ods.filter((o) => o.status === 'pending').length;
  const approvedCount = ods.filter((o) => o.status === 'approved').length;
  const rejectedCount = ods.filter((o) => o.status === 'rejected').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
            <PageHeader
              icon={ClipboardCheck}
              title="OD Sanction & Approvals"
              description="Review and sanction Bennett University On Duty attendance requests submitted by club members"
            />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Submissions
                </span>
                <span className="text-2xl font-bold text-foreground mt-1">{ods.length}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">
                    Needs Review
                  </span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">
                    Sanctioned
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-2xl font-bold text-emerald-500 mt-1">{approvedCount}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-destructive uppercase tracking-wider">
                    Declined
                  </span>
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-2xl font-bold text-destructive mt-1">{rejectedCount}</span>
              </Card>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 border-b sm:border-b-0 border-border/60 pb-2 sm:pb-0">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                      statusFilter === tab
                        ? 'bg-accent/15 text-accent border border-accent/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {tab} {tab === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search member, roll or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
            </div>

            {/* OD List */}
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ) : filteredOds.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No OD Requests Found"
                description={
                  searchQuery
                    ? `No requests match "${searchQuery}".`
                    : `No OD requests currently in "${statusFilter}" state.`
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredOds.map((od) => {
                  const isExpanded = expandedId === od.id;
                  const lecturesCount = od.lectures?.length || 0;

                  return (
                    <Card
                      key={od.id}
                      className="border border-border/80 shadow-xs overflow-hidden transition-all duration-200"
                    >
                      <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <MemberAvatar
                            src={od.user?.avatarUrl}
                            name={od.user?.name || 'Member'}
                            className="h-10 w-10 rounded-lg shrink-0 border border-border"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">
                                {od.user?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({od.user?.rollNumber})
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {od.user?.teamName || 'Member'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  od.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                    : od.status === 'rejected'
                                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                }
                              >
                                {od.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="text-xs text-foreground font-medium">
                              Reason: {od.reason}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(od.date).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {lecturesCount} {lecturesCount === 1 ? 'Period' : 'Periods'} Missed
                              </span>
                              {od.session && (
                                <>
                                  <span>•</span>
                                  <span>Event: {od.session.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border/40">
                          {od.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(od, 'rejected')}
                                className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openReviewModal(od, 'approved')}
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                Approve OD
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openReviewModal(
                                  od,
                                  od.status === 'approved' ? 'rejected' : 'approved'
                                )
                              }
                              className="h-8 text-xs"
                            >
                              Change to {od.status === 'approved' ? 'Reject' : 'Approve'}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedId(isExpanded ? null : od.id)}
                            className="h-8 w-8 text-muted-foreground"
                            title="Toggle Periods"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Missed Lectures Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/15 space-y-3">
                          {od.adminNotes && (
                            <div className="p-2.5 rounded-lg bg-card border border-border/80 text-xs">
                              <span className="font-semibold text-foreground">Admin Feedback: </span>
                              <span className="text-muted-foreground">{od.adminNotes}</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Reported Missed Classes ({lecturesCount})
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {od.lectures?.map((lec: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg bg-card border border-border/80 space-y-1.5 text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-accent text-[11px]">
                                      {lec.timeSlot}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                      {lec.classType}
                                    </Badge>
                                  </div>
                                  <div className="font-medium text-foreground">
                                    {lec.subjectName} ({lec.subjectCode})
                                  </div>
                                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                                    <span>Faculty: {lec.facultyName}</span>
                                    {lec.room && <span>Room: {lec.room}</span>}
                                  </div>
                                  {lec.remarks && (
                                    <div className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1 mt-1">
                                      Note: {lec.remarks}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Review Dialog */}
        <Dialog
          open={reviewDialog.isOpen}
          onOpenChange={(open) => !open && setReviewDialog((prev) => ({ ...prev, isOpen: false }))}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {reviewDialog.status === 'approved' ? 'Approve OD Request' : 'Reject OD Request'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                For {reviewDialog.memberName}. This decision will update member records and attendance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Feedback / Admin Notes (Optional)</Label>
                <Input
                  placeholder={
                    reviewDialog.status === 'approved'
                      ? 'e.g. Sanctioned for tech fest duty'
                      : 'e.g. Missing faculty verification'
                  }
                  value={reviewDialog.notes}
                  onChange={(e) =>
                    setReviewDialog((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewDialog((prev) => ({ ...prev, isOpen: false }))}
                disabled={reviewDialog.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReview}
                disabled={reviewDialog.isSubmitting}
                className={
                  reviewDialog.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                }
              >
                {reviewDialog.isSubmitting
                  ? 'Saving...'
                  : reviewDialog.status === 'approved'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
