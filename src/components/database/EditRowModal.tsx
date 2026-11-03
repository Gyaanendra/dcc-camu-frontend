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
import { Loader2, Save, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface ColumnMeta {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
  isTimestamp: boolean;
}

interface EditRowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  row: Record<string, any> | null;
  columns: ColumnMeta[];
  onSaveSuccess: () => void;
}

export const EditRowModal: React.FC<EditRowModalProps> = ({
  open,
  onOpenChange,
  tableName,
  row,
  columns,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && row) {
      const initial: Record<string, any> = {};
      columns.forEach((col) => {
        const val = row[col.name];
        if (col.isTimestamp && typeof val === 'number') {
          // Convert timestamp ms to datetime-local string (YYYY-MM-DDTHH:mm)
          const d = new Date(val);
          const pad = (n: number) => String(n).padStart(2, '0');
          initial[col.name] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
          initial[col.name] = val !== null && val !== undefined ? String(val) : '';
        }
      });
      setFormData(initial);
    }
  }, [open, row, columns]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row?.id) return;

    setSaving(true);
    try {
      const payload: Record<string, any> = {};

      columns.forEach((col) => {
        if (col.isPrimaryKey) return; // Do not send primary key

        const rawVal = formData[col.name];
        if (rawVal === '' && col.isNullable) {
          payload[col.name] = null;
        } else if (col.isTimestamp) {
          payload[col.name] = rawVal ? new Date(rawVal).toISOString() : null;
        } else {
          payload[col.name] = rawVal;
        }
      });

      await api.updateTableRow(tableName, row.id, payload);
      toast.success(`Row in '${tableName}' updated successfully!`);
      onSaveSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update row.');
    } finally {
      setSaving(false);
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Edit Record in <span className="font-mono text-primary">{tableName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate max-w-[400px]">
                ID: {row.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col) => {
              const isPk = col.isPrimaryKey;
              const val = formData[col.name] ?? '';

              // Special dropdown for known enum fields
              if (col.name === 'role' && tableName === 'users') {
                return (
                  <div key={col.name} className="space-y-1.5">
                    <Label className="text-xs font-medium capitalize">{col.name}</Label>
                    <Select value={val} onValueChange={(v) => handleChange(col.name, v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User / Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="advisor">Advisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (col.name === 'status' && tableName === 'attendance') {
                return (
                  <div key={col.name} className="space-y-1.5">
                    <Label className="text-xs font-medium capitalize">{col.name}</Label>
                    <Select value={val} onValueChange={(v) => handleChange(col.name, v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="not_in_club">Not In Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (col.name === 'status' && tableName === 'od_requests') {
                return (
                  <div key={col.name} className="space-y-1.5">
                    <Label className="text-xs font-medium capitalize">{col.name}</Label>
                    <Select value={val} onValueChange={(v) => handleChange(col.name, v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (col.isTimestamp) {
                return (
                  <div key={col.name} className="space-y-1.5">
                    <Label className="text-xs font-medium capitalize">
                      {col.name.replace(/_/g, ' ')} <span className="text-[10px] text-muted-foreground">(Time)</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      className="h-9 text-xs"
                      value={val}
                      onChange={(e) => handleChange(col.name, e.target.value)}
                    />
                  </div>
                );
              }

              return (
                <div key={col.name} className={`space-y-1.5 ${col.name.includes('description') || col.name.includes('lectures') || col.name.includes('metadata') ? 'sm:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium capitalize">
                      {col.name.replace(/_/g, ' ')}
                    </Label>
                    {isPk && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Primary Key
                      </span>
                    )}
                  </div>
                  <Input
                    className="h-9 text-xs font-mono"
                    value={val}
                    disabled={isPk}
                    placeholder={col.isNullable ? 'NULL' : ''}
                    onChange={(e) => handleChange(col.name, e.target.value)}
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-4 border-t border-border/60 gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

