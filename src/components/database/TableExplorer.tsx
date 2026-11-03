'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditRowModal, ColumnMeta } from './EditRowModal';
import { DeleteRowDialog } from './DeleteRowDialog';
import {
  Database,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface TableMeta {
  name: string;
  rowCount: number;
  columns: ColumnMeta[];
}

export const TableExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTable, setActiveTable] = useState<string>('users');
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingRows, setLoadingRows] = useState<boolean>(false);

  // Pagination & Search
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Modals state
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingIdentifier, setDeletingIdentifier] = useState<string>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Load all table metadata
  const fetchTableMeta = useCallback(async () => {
    try {
      setLoadingTables(true);
      const res = await api.getDatabaseTables();
      if (res?.tables) {
        setTables(res.tables);
        if (!activeTable && res.tables.length > 0) {
          setActiveTable(res.tables[0].name);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load database tables');
    } finally {
      setLoadingTables(false);
    }
  }, [activeTable]);

  useEffect(() => {
    fetchTableMeta();
  }, [fetchTableMeta]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load rows for the active table
  const fetchRows = useCallback(async () => {
    if (!activeTable) return;
    try {
      setLoadingRows(true);
      const res = await api.getTableRows(activeTable, {
        page,
        limit: 25,
        search: debouncedSearch,
      });

      if (res?.rows) {
        setRows(res.rows);
        setTotalPages(res.totalPages || 1);
        setTotalRows(res.total || 0);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to fetch data for ${activeTable}`);
    } finally {
      setLoadingRows(false);
    }
  }, [activeTable, page, debouncedSearch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const currentTableMeta = tables.find((t) => t.name === activeTable);
  const columns = currentTableMeta?.columns || [];

  const handleEditClick = (row: Record<string, any>) => {
    setEditingRow(row);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (row: Record<string, any>) => {
    setDeletingId(row.id);
    const identifier = row.name
      ? `${row.name} (${row.roll_number || row.id})`
      : row.title
      ? `${row.title} (${row.id})`
      : `ID: ${row.id}`;
    setDeletingIdentifier(identifier);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Table Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        {loadingTables ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tables...
          </div>
        ) : (
          tables.map((t) => {
            const isActive = t.name === activeTable;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setActiveTable(t.name);
                  setPage(1);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="capitalize">{t.name.replace(/_/g, ' ')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background/80 text-muted-foreground'
                  }`}
                >
                  {t.rowCount}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTable}...`}
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTableMeta();
              fetchRows();
            }}
            disabled={loadingRows}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingRows ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1">
            {totalRows} records
          </Badge>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-3.5 font-semibold text-center w-24">Actions</th>
                {columns.map((col) => (
                  <th key={col.name} className="py-3 px-3.5 whitespace-nowrap font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      {col.isPrimaryKey && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-mono">
                          PK
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loadingRows ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Fetching rows from {activeTable}...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-muted-foreground">
                    No records found in <span className="font-mono font-medium">{activeTable}</span>.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEditClick(row)}
                          title="Edit row"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(row)}
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>

                    {/* Dynamic Columns */}
                    {columns.map((col) => {
                      const raw = row[col.name];
                      const isoDate = row[`_${col.name}_iso`];

                      if (raw === null || raw === undefined) {
                        return (
                          <td key={col.name} className="py-2.5 px-3.5 text-muted-foreground/50 font-mono italic">
                            null
                          </td>
                        );
                      }

                      // Formatted timestamps
                      if (isoDate) {
                        return (
                          <td key={col.name} className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px]" title={isoDate}>
                            {new Date(isoDate).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                        );
                      }

                      // Status or role badge
                      if (col.name === 'status' || col.name === 'role') {
                        return (
                          <td key={col.name} className="py-2.5 px-3.5 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                              {String(raw)}
                            </Badge>
                          </td>
                        );
                      }

                      // UUIDs and long texts: shorten with title
                      const str = String(raw);
                      const isLong = str.length > 30;

                      return (
                        <td
                          key={col.name}
                          className="py-2.5 px-3.5 max-w-[220px] truncate font-mono text-[11px]"
                          title={isLong ? str : undefined}
                        >
                          {str}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{rows.length}</span> of{' '}
            <span className="font-medium text-foreground">{totalRows}</span> rows
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loadingRows}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loadingRows}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditRowModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        tableName={activeTable}
        row={editingRow}
        columns={columns}
        onSaveSuccess={() => {
          fetchRows();
          fetchTableMeta();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteRowDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        tableName={activeTable}
        rowId={deletingId}
        displayIdentifier={deletingIdentifier}
        onDeleteSuccess={() => {
          fetchRows();
          fetchTableMeta();
        }}
      />
    </div>
  );
};
