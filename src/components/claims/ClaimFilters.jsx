import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QUEUE_CONFIG, STATUS_CONFIG, RISK_CONFIG } from '@/lib/constants';
import { Search, X } from 'lucide-react';

export default function ClaimFilters({ filters, onChange, onClear }) {
  const update = (key, value) => {
    onChange({ ...filters, [key]: value === 'all' ? '' : value });
  };

  const hasFilters = Object.values(filters).some(v => v && v !== '');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patient, claim #…"
          value={filters.search || ''}
          onChange={e => update('search', e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select value={filters.queue || 'all'} onValueChange={v => update('queue', v)}>
        <SelectTrigger className="w-40 h-9 text-sm">
          <SelectValue placeholder="Queue" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Queues</SelectItem>
          {Object.entries(QUEUE_CONFIG).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status || 'all'} onValueChange={v => update('status', v)}>
        <SelectTrigger className="w-40 h-9 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.risk || 'all'} onValueChange={v => update('risk', v)}>
        <SelectTrigger className="w-32 h-9 text-sm">
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk</SelectItem>
          {Object.entries(RISK_CONFIG).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs gap-1.5">
          <X className="w-3.5 h-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}