'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditRowModal, ColumnMeta } from './EditRowModal';
import { DeleteRowDialog } from './DeleteRowDialog';
import {
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Table as TableIcon,
  Copy,
  Check,
  X,
  Users,
  Shield,
  CalendarCheck,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface TableMeta {
  name: string;
  rowCount: number;
  columns: ColumnMeta[];
}

const TABLE_ICONS: Record<string, React.ElementType> = {
  teams: Shield,
  users: Users,
  sessions: CalendarCheck,
  attendance: CheckCircle,
  od_requests: FileText,
};

export const TableExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTable, setActiveTable] = useState<string>('users');
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingRows, setLoadingRows] = useState<boolean>(false);

  // Pagination & Search
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        limit,
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
  }, [activeTable, page, limit, debouncedSearch]);

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

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('UUID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Table Selector Tabs */}
      <Card className="p-2 bg-card border-border/70 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {loadingTables ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading tables...
            </div>
          ) : (
            tables.map((t) => {
              const isActive = t.name === activeTable;
              const IconComponent = TABLE_ICONS[t.name] || TableIcon;

              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setActiveTable(t.name);
                    setPage(1);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span className="capitalize">{t.name.replace(/_/g, ' ')}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.rowCount}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search across ${activeTable}...`}
            className="pl-9 pr-8 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 justify-end">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTableMeta();
              fetchRows();
            }}
            disabled={loadingRows}
            className="h-8 gap-1.5 text-xs"
            title="Reload table records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingRows ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 shrink-0">
            {totalRows} records
          </Badge>
        </div>
      </div>

      {/* Main Data Table */}
      <Card className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-muted/95 backdrop-blur-md z-20 border-b border-border/80 shadow-xs">
              <tr className="text-muted-foreground font-medium">
                {/* Actions column pinned on the left */}
                <th className="py-3 px-3.5 font-semibold text-center w-20 sticky left-0 bg-muted/95 z-30 border-r border-border/60">
                  Actions
                </th>
                {columns.map((col) => (
                  <th key={col.name} className="py-3 px-4 whitespace-nowrap font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      {col.isPrimaryKey && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/15 text-primary font-mono font-bold uppercase">
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
                  <td colSpan={columns.length + 1} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Fetching rows from {activeTable}...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center text-muted-foreground">
                    <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-foreground">No records found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {searchTerm ? `No rows matched "${searchTerm}".` : `Table "${activeTable}" has no rows.`}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40 transition-colors group">
                    {/* Sticky Action Buttons */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap sticky left-0 bg-card group-hover:bg-muted/40 z-10 border-r border-border/60 transition-colors">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                          onClick={() => handleEditClick(row)}
                          title="Edit row"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
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
                          <td key={col.name} className="py-2.5 px-4 text-muted-foreground/40 font-mono italic">
                            null
                          </td>
                        );
                      }

                      // Primary Key / ID formatting with copy button
                      if (col.isPrimaryKey) {
                        const idStr = String(raw);
                        const isCopied = copiedId === idStr;
                        return (
                          <td key={col.name} className="py-2.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopyId(idStr)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted font-mono text-[11px] text-foreground transition-colors group/id"
                              title="Click to copy full ID"
                            >
                              <span className="truncate max-w-[110px]">{idStr}</span>
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground/60 group-hover/id:text-foreground shrink-0" />
                              )}
                            </button>
                          </td>
                        );
                      }

                      // Formatted timestamps
                      if (isoDate) {
                        const d = new Date(isoDate);
                        return (
                          <td key={col.name} className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]" title={isoDate}>
                            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                            <span className="text-muted-foreground">
                              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        );
                      }

                      // Status or role badge
                      if (col.name === 'status' || col.name === 'role') {
                        return (
                          <td key={col.name} className="py-2.5 px-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${
                                raw === 'present' || raw === 'approved' || raw === 'admin'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : raw === 'late' || raw === 'pending' || raw === 'advisor'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-muted text-muted-foreground border-border/60'
                              }`}
                            >
                              {String(raw)}
                            </Badge>
                          </td>
                        );
                      }

                      // Default text display
                      const str = String(raw);
                      const isLong = str.length > 35;

                      return (
                        <td
                          key={col.name}
                          className="py-2.5 px-4 max-w-[260px] truncate text-xs"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{rows.length}</span> of{' '}
            <span className="font-semibold text-foreground">{totalRows}</span> total records
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">
              Page {page} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
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
      </Card>

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
