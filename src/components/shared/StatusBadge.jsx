import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, RISK_CONFIG, QUEUE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'slate' };
  return (
    <Badge variant="outline" className={cn(`bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200 text-xs font-medium`)}>
      {config.label}
    </Badge>
  );
}

export function RiskBadge({ risk }) {
  const config = RISK_CONFIG[risk] || { label: risk, color: 'slate' };
  return (
    <Badge variant="outline" className={cn(`bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200 text-xs font-medium`)}>
      {config.label}
    </Badge>
  );
}

export function QueueBadge({ queue }) {
  const config = QUEUE_CONFIG[queue] || { label: queue, color: 'slate' };
  return (
    <Badge variant="outline" className={cn(`bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200 text-xs font-medium`)}>
      {config.label}
    </Badge>
  );
}