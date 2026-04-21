import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import ClaimFilters from '@/components/claims/ClaimFilters';
import ClaimTable from '@/components/claims/ClaimTable';
import { Button } from '@/components/ui/button';
import { Download, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/shared/EmptyState';

export default function Claims() {
  const [searchParams] = useSearchParams();
  const initialQueue = searchParams.get('queue') || '';

  const [filters, setFilters] = useState({
    search: '',
    queue: initialQueue,
    status: '',
    risk: '',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState('priority_score');
  const [sortDir, setSortDir] = useState('desc');

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => base44.entities.Claim.list('-priority_score', 500),
  });

  const filtered = useMemo(() => {
    let result = [...claims];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(c =>
        (c.patient_name || '').toLowerCase().includes(s) ||
        (c.claim_number || '').toLowerCase().includes(s) ||
        (c.payer_name || '').toLowerCase().includes(s)
      );
    }
    if (filters.queue) result = result.filter(c => c.queue_name === filters.queue);
    if (filters.status) result = result.filter(c => c.status === filters.status);
    if (filters.risk) result = result.filter(c => c.risk_level === filters.risk);

    result.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [claims, filters, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Claims Workspace" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Claims Workspace"
        description={`${filtered.length} claims`}
        actions={
          <Button variant="outline" size="sm" className="gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </Button>
        }
      />

      <ClaimFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ search: '', queue: '', status: '', risk: '' })}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" className="text-xs">Assign Owner</Button>
          <Button variant="outline" size="sm" className="text-xs">Change Queue</Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedIds([])}>
            Clear Selection
          </Button>
        </div>
      )}

      {claims.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No Claims Yet"
          description="Import a billing file to get started with your claims workspace."
        />
      ) : (
        <ClaimTable
          claims={filtered}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
    </div>
  );
}