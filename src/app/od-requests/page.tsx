'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ODSubmitModal } from '@/components/od/ODSubmitModal';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

interface ODRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  lectures: Array<{
    id?: string;
    timeSlot: string;
    subjectName: string;
    subjectCode: string;
    classType: string;
    facultyName: string;
    room?: string;
    remarks?: string;
  }>;
}

export default function ODRequestsPage() {
  const [ods, setOds] = useState<ODRecord[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [odData, sessionData] = await Promise.all([
        api.getMyODs(),
        api.getSessions().catch(() => ({ sessions: [] })),
      ]);
      setOds(odData || []);
      setSessions(sessionData?.sessions || []);
    } catch (err: any) {
      toast.error('Failed to load OD requests: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending OD request?')) return;
    try {
      await api.deleteOD(id);
      toast.success('OD request cancelled');
      setOds((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request');
    }
  };

  const filteredOds = ods.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const totalOds = ods.length;
  const pendingCount = ods.filter((o) => o.status === 'pending').length;
  const approvedCount = ods.filter((o) => o.status === 'approved').length;
  const rejectedCount = ods.filter((o) => o.status === 'rejected').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navbar />
        <div className="flex flex-1 items-start">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <PageHeader
                icon={FileText}
                title="On Duty (OD) Requests"
                description="Submit missed Bennett University lectures for official club activities & duty sanction"
              />
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 shadow-sm text-xs h-9 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Submit OD</span>
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Requests
                </span>
                <span className="text-2xl font-bold text-foreground mt-1">{totalOds}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider">
                    Pending Review
                  </span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">
                    Approved
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-2xl font-bold text-emerald-500 mt-1">{approvedCount}</span>
              </Card>

              <Card className="p-3.5 flex flex-col justify-between border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-destructive uppercase tracking-wider">
                    Rejected
                  </span>
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-2xl font-bold text-destructive mt-1">{rejectedCount}</span>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                    statusFilter === tab
                      ? 'bg-accent/15 text-accent border border-accent/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* OD List */}
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : filteredOds.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No OD Requests Found"
                description={
                  statusFilter === 'all'
                    ? "You haven't submitted any OD requests yet. Submit missed lectures to receive official club attendance exemption."
                    : `No OD requests with status "${statusFilter}".`
                }
                action={
                  <Button
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs h-8"
                  >
                    Submit First OD
                  </Button>
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
                      <div
                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/10"
                        onClick={() => setExpandedId(isExpanded ? null : od.id)}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                              {od.reason}
                            </span>
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
                              {lecturesCount} {lecturesCount === 1 ? 'Lecture' : 'Lectures'} Missed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {od.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(od.id);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Cancel Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <div className="text-muted-foreground p-1">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Lecture Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/15 space-y-3">
                          {od.adminNotes && (
                            <div className="p-3 rounded-lg bg-card border border-border/80 text-xs">
                              <span className="font-semibold text-foreground">Admin Feedback: </span>
                              <span className="text-muted-foreground">{od.adminNotes}</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Missed Periods & Subjects Breakdown
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {od.lectures?.map((lec, idx) => (
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

        <ODSubmitModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          sessions={sessions}
        />
      </div>
    </ProtectedRoute>
  );
}
