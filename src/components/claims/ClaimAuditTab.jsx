import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Shield, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function ClaimAuditTab({ claimId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['claim-audit', claimId],
    queryFn: () => base44.entities.AuditLog.filter({ entity_id: claimId }, '-created_date'),
  });

  if (logs.length === 0) {
    return <EmptyState icon={Shield} title="No Audit History" description="Changes to this claim will be logged here." />;
  }

  return (
    <div className="space-y-0">
      {logs.map((log, idx) => (
        <div key={log.id} className="flex gap-4 py-3 border-b last:border-0">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
            {idx < logs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{log.action}</span>
              <span className="text-xs text-muted-foreground">by {log.performed_by_name || log.performed_by_email || 'System'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}
            </p>
            {log.old_value && log.new_value && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <code className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[11px]">
                  {typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : String(log.old_value)}
                </code>
                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[11px]">
                  {typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : String(log.new_value)}
                </code>
              </div>
            )}
            {log.reason && <p className="text-xs text-muted-foreground mt-1 italic">Reason: {log.reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}