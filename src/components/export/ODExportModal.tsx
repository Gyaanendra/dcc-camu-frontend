'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, FileSpreadsheet, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ODExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: string;
}

export const ODExportModal: React.FC<ODExportModalProps> = ({
  open,
  onOpenChange,
  defaultStatus,
}) => {
  const [mode, setMode] = useState<'all' | 'filtered'>(defaultStatus ? 'filtered' : 'all');
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);

  const [selectedStatus, setSelectedStatus] = useState<string>(defaultStatus || 'all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (defaultStatus) {
        setSelectedStatus(defaultStatus);
        setMode('filtered');
      }
      api.getTeams().then((res: any) => {
        if (Array.isArray(res)) setTeams(res);
        else if (res?.teams) setTeams(res.teams);
      }).catch(() => {});
    }
  }, [open, defaultStatus]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      let queryPath = '/od/export/csv';

      if (mode === 'filtered') {
        const params = new URLSearchParams();
        if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
        if (selectedTeam && selectedTeam !== 'all') params.set('teamId', selectedTeam);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        if (params.toString()) {
          queryPath += `?${params.toString()}`;
        }
      }

      await api.downloadCsv(queryPath, 'dcc_od_requests_export.csv');
      toast.success('OD requests CSV downloaded successfully!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to download OD requests CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Export On-Duty (OD) Requests</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Download a detailed CSV record of member OD submissions and approvals.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('all')}
              className={`text-xs font-medium py-1.5 rounded-md transition-all ${
                mode === 'all'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Export All ODs
            </button>
            <button
              type="button"
              onClick={() => setMode('filtered')}
              className={`text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                mode === 'filtered'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Filter className="h-3 w-3" />
              Filtered Export
            </button>
          </div>

          {mode === 'all' ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">All Submissions</p>
              <p>
                Exports every On-Duty request including member roll number, reason, lecture time slots, review status, and administrator remarks.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {/* Status & Team Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Approval Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Team / Wing</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

