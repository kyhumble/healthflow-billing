import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, Download, ArrowRight, Shield } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLog() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200),
  });

  const filtered = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.entity_type || '').toLowerCase().includes(s) ||
      (log.action || '').toLowerCase().includes(s) ||
      (log.performed_by_name || '').toLowerCase().includes(s) ||
      (log.performed_by_email || '').toLowerCase().includes(s)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Log" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Complete history of all system changes"
        actions={
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search logs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No Audit Entries" description="Actions will be logged here as changes are made." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Timestamp</TableHead>
                <TableHead className="text-xs">Entity</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(log => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-muted-foreground font-tabular whitespace-nowrap">
                    {format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.performed_by_name || log.performed_by_email || '—'}</TableCell>
                  <TableCell>
                    {log.old_value && log.new_value ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <code className="bg-red-50 text-red-700 px-1 py-0.5 rounded text-[10px] max-w-[120px] truncate">
                          {typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : String(log.old_value)}
                        </code>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <code className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-[10px] max-w-[120px] truncate">
                          {typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : String(log.new_value)}
                        </code>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}