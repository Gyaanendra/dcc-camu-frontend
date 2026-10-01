'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Plus, Trash2, Clock, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const BENNETT_PERIODS = [
  { id: 'p1', label: 'Period 1 (08:20 AM - 09:20 AM)', timeSlot: '08:20 AM - 09:20 AM' },
  { id: 'p2', label: 'Period 2 (09:25 AM - 10:25 AM)', timeSlot: '09:25 AM - 10:25 AM' },
  { id: 'p3', label: 'Period 3 (10:30 AM - 11:30 AM)', timeSlot: '10:30 AM - 11:30 AM' },
  { id: 'p4', label: 'Period 4 (11:35 AM - 12:35 PM)', timeSlot: '11:35 AM - 12:35 PM' },
  { id: 'p5', label: 'Period 5 (12:40 PM - 01:40 PM)', timeSlot: '12:40 PM - 01:40 PM' },
  { id: 'recess', label: 'Recess (01:40 PM - 02:50 PM)', timeSlot: '01:40 PM - 02:50 PM' },
  { id: 'p6', label: 'Period 6 (02:50 PM - 03:50 PM)', timeSlot: '02:50 PM - 03:50 PM' },
  { id: 'p7', label: 'Period 7 (03:55 PM - 04:55 PM)', timeSlot: '03:55 PM - 04:55 PM' },
  { id: 'p8', label: 'Period 8 (05:00 PM - 06:00 PM)', timeSlot: '05:00 PM - 06:00 PM' },
  { id: 'lab1', label: 'Lab Slot 1 & 2 (08:20 AM - 10:25 AM)', timeSlot: '08:20 AM - 10:25 AM' },
  { id: 'lab2', label: 'Lab Slot 3 & 4 (10:30 AM - 12:35 PM)', timeSlot: '10:30 AM - 12:35 PM' },
  { id: 'lab3', label: 'Lab Slot 6 & 7 (02:50 PM - 04:55 PM)', timeSlot: '02:50 PM - 04:55 PM' },
];

export interface LectureItem {
  id: string;
  timeSlot: string;
  subjectName: string;
  subjectCode: string;
  classType: 'lecture' | 'practical' | 'tutorial';
  facultyName: string;
  room: string;
  remarks: string;
}

interface ODSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessions?: Array<{ id: string; title: string; sessionDate: string }>;
}

export const ODSubmitModal: React.FC<ODSubmitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sessions = [],
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lectures, setLectures] = useState<LectureItem[]>([
    {
      id: '1',
      timeSlot: '08:20 AM - 09:20 AM',
      subjectName: '',
      subjectCode: '',
      classType: 'lecture',
      facultyName: '',
      room: '',
      remarks: '',
    },
  ]);

  const addLecture = () => {
    const nextPeriodIndex = Math.min(lectures.length, BENNETT_PERIODS.length - 1);
    const nextSlot = BENNETT_PERIODS[nextPeriodIndex]?.timeSlot || '10:30 AM - 11:30 AM';
    setLectures((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timeSlot: nextSlot,
        subjectName: '',
        subjectCode: '',
        classType: 'lecture',
        facultyName: '',
        room: '',
        remarks: '',
      },
    ]);
  };

  const removeLecture = (id: string) => {
    if (lectures.length <= 1) return;
    setLectures((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLecture = (id: string, field: keyof LectureItem, value: any) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Please select a date for the OD request.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason or club activity name.');
      return;
    }

    // Validate lectures
    for (let i = 0; i < lectures.length; i++) {
      const lec = lectures[i];
      if (!lec.subjectName.trim() || !lec.subjectCode.trim()) {
        setErrorMessage(`Please fill subject name and code for lecture #${i + 1}.`);
        return;
      }
      if (!lec.facultyName.trim()) {
        setErrorMessage(`Please fill faculty name for lecture #${i + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.submitOD({
        date,
        reason: reason.trim(),
        sessionId: selectedSessionId !== 'none' ? selectedSessionId : null,
        lectures: lectures.map((l) => ({
          timeSlot: l.timeSlot,
          subjectName: l.subjectName.trim(),
          subjectCode: l.subjectCode.trim().toUpperCase(),
          classType: l.classType,
          facultyName: l.facultyName.trim(),
          room: l.room.trim() || undefined,
          remarks: l.remarks.trim() || undefined,
        })),
      });

      toast.success('OD Request submitted successfully!');
      onSuccess();
      onClose();
      // Reset form
      setReason('');
      setLectures([
        {
          id: '1',
          timeSlot: '08:20 AM - 09:20 AM',
          subjectName: '',
          subjectCode: '',
          classType: 'lecture',
          facultyName: '',
          room: '',
          remarks: '',
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit OD request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/15 text-accent">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Submit On Duty (OD) Request
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Log missed Bennett University classes due to club events or official duties.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Activity / Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Activity Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Event / Reason *</Label>
              <Input
                type="text"
                placeholder="e.g. Club Technical Workshop Setup & Stage Duty"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Related DCC Session (Optional)</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Independent Duty</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} ({new Date(s.sessionDate).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Missed Lectures List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Missed Lectures ({lectures.length})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Add each lecture or practical slot you missed for this day.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLecture}
                className="h-7 text-xs gap-1.5 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lecture</span>
              </Button>
            </div>

            <div className="space-y-3">
              {lectures.map((lec, idx) => (
                <div
                  key={lec.id}
                  className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        Lecture #{idx + 1}
                      </span>
                    </div>
                    {lectures.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLecture(lec.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove lecture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Timing Dropdown */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Time Slot *</Label>
                      <Select
                        value={lec.timeSlot}
                        onValueChange={(val) => updateLecture(lec.id, 'timeSlot', val)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select timing" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {BENNETT_PERIODS.map((p) => (
                            <SelectItem key={p.id} value={p.timeSlot} className="text-xs">
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Class Type */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Class Type</Label>
                      <Select
                        value={lec.classType}
                        onValueChange={(val: any) => updateLecture(lec.id, 'classType', val)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lecture" className="text-xs">Lecture</SelectItem>
                          <SelectItem value="practical" className="text-xs">Practical / Lab</SelectItem>
                          <SelectItem value="tutorial" className="text-xs">Tutorial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject Code */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Subject Code *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. CSEN201"
                        value={lec.subjectCode}
                        onChange={(e) => updateLecture(lec.id, 'subjectCode', e.target.value)}
                        className="text-xs h-8"
                        required
                      />
                    </div>

                    {/* Subject Name */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Subject Name *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Computer Networks"
                        value={lec.subjectName}
                        onChange={(e) => updateLecture(lec.id, 'subjectName', e.target.value)}
                        className="text-xs h-8"
                        required
                      />
                    </div>

                    {/* Faculty Name */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Faculty Name *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Dr. A. Sharma"
                        value={lec.facultyName}
                        onChange={(e) => updateLecture(lec.id, 'facultyName', e.target.value)}
                        className="text-xs h-8"
                        required
                      />
                    </div>

                    {/* Room / Lab */}
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Room / Lab (Optional)</Label>
                      <Input
                        type="text"
                        placeholder="e.g. LH-101 / Lab 204"
                        value={lec.room}
                        onChange={(e) => updateLecture(lec.id, 'room', e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Admin review is required for CAMU credit approval</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? 'Submitting...' : `Submit OD (${lectures.length} Lectures)`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
