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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DeleteRowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  rowId: string | null;
  displayIdentifier?: string;
  onDeleteSuccess: () => void;
}

export const DeleteRowDialog: React.FC<DeleteRowDialogProps> = ({
  open,
  onOpenChange,
  tableName,
  rowId,
  displayIdentifier,
  onDeleteSuccess,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!rowId) return;

    setDeleting(true);
    try {
      await api.deleteTableRow(tableName, rowId);
      toast.success(`Row deleted from '${tableName}'.`);
      onDeleteSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete row.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Delete Row</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-muted-foreground space-y-2">
          <p>
            Are you sure you want to permanently delete this row from <span className="font-semibold text-foreground">{tableName}</span>?
          </p>
          <div className="rounded-md bg-muted p-2.5 font-mono text-[11px] break-all border border-border/50 text-foreground">
            {displayIdentifier || `ID: ${rowId}`}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

