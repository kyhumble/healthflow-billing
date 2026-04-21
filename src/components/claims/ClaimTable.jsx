import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, RiskBadge, QueueBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, ListTodo, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClaimTable({ claims, selectedIds, onSelect, onSelectAll, sortField, sortDir, onSort }) {
  const allSelected = claims.length > 0 && selectedIds.length === claims.length;

  const SortHeader = ({ field, children, className }) => (
    <TableHead
      className={cn('text-xs cursor-pointer select-none hover:text-foreground transition-colors', className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto border rounded-xl bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <SortHeader field="patient_name">Patient</SortHeader>
            <SortHeader field="dos">DOS</SortHeader>
            <SortHeader field="payer_name">Payer</SortHeader>
            <SortHeader field="balance" className="text-right">Balance</SortHeader>
            <SortHeader field="status">Status</SortHeader>
            <SortHeader field="queue_name">Queue</SortHeader>
            <SortHeader field="risk_level">Risk</SortHeader>
            <SortHeader field="priority_score" className="text-right">Priority</SortHeader>
            <TableHead className="text-xs">Owner</TableHead>
            <SortHeader field="due_date">Due</SortHeader>
            <TableHead className="text-xs w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map(claim => (
            <TableRow key={claim.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(claim.id)}
                  onCheckedChange={() => onSelect(claim.id)}
                />
              </TableCell>
              <TableCell>
                <Link to={`/claims/${claim.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                  {claim.patient_name}
                </Link>
                {claim.claim_number && (
                  <p className="text-xs text-muted-foreground mt-0.5">#{claim.claim_number}</p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-tabular whitespace-nowrap">
                {claim.dos ? format(new Date(claim.dos), 'MM/dd/yy') : '—'}
              </TableCell>
              <TableCell className="text-sm">{claim.payer_name || '—'}</TableCell>
              <TableCell className="text-sm text-right font-semibold font-tabular">
                {formatCurrency(claim.balance)}
              </TableCell>
              <TableCell><StatusBadge status={claim.status} /></TableCell>
              <TableCell><QueueBadge queue={claim.queue_name} /></TableCell>
              <TableCell><RiskBadge risk={claim.risk_level} /></TableCell>
              <TableCell className="text-sm text-right font-bold font-tabular text-primary">
                {claim.priority_score || 0}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground truncate max-w-[100px]">
                {claim.owner_name || '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-tabular whitespace-nowrap">
                {claim.due_date ? format(new Date(claim.due_date), 'MM/dd/yy') : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(claim.notes_count || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" /> {claim.notes_count}
                    </span>
                  )}
                  {(claim.tasks_count || 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <ListTodo className="w-3 h-3" /> {claim.tasks_count}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {claims.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-sm text-muted-foreground py-12">
                No claims match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}