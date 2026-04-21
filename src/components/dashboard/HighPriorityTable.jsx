import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, RiskBadge, QueueBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';

export default function HighPriorityTable({ claims }) {
  const sorted = [...(claims || [])]
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Top 10 High-Priority Claims</CardTitle>
          <Link to="/claims?sort=priority" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Patient</TableHead>
                <TableHead className="text-xs">DOS</TableHead>
                <TableHead className="text-xs">Payer</TableHead>
                <TableHead className="text-xs text-right">Balance</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Queue</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
                <TableHead className="text-xs text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(claim => (
                <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Link to={`/claims/${claim.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                      {claim.patient_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-tabular">
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
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No claims yet. Import a file to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}