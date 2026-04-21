import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, TrendingUp, ListChecks } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import QueueOverview from '@/components/dashboard/QueueOverview';
import AgingChart from '@/components/dashboard/AgingChart';
import HighPriorityTable from '@/components/dashboard/HighPriorityTable';
import { formatCompactCurrency } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function Dashboard() {
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => base44.entities.Claim.list('-priority_score', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-open'],
    queryFn: () => base44.entities.ClaimTask.filter({ status: 'open' }),
  });

  const totalAR = claims.reduce((sum, c) => sum + (c.balance || 0), 0);
  const highPriorityClaims = claims.filter(c => c.risk_level === 'high').length;
  const deniedClaims = claims.filter(c => c.status === 'DENIED');
  const recoverableRevenue = deniedClaims.reduce((sum, c) => sum + (c.balance || 0), 0);
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Operations overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time billing operations overview"
        actions={
          <Link to="/imports">
            <Button size="sm" className="gap-2">
              <Upload className="w-4 h-4" /> Import File
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total AR" value={formatCompactCurrency(totalAR)} icon={DollarSign} />
        <StatCard title="High-Risk Claims" value={highPriorityClaims} icon={AlertTriangle} subtitle={`of ${claims.length} total`} />
        <StatCard title="Recoverable Revenue" value={formatCompactCurrency(recoverableRevenue)} icon={TrendingUp} subtitle={`${deniedClaims.length} denied claims`} />
        <StatCard title="Overdue Tasks" value={overdueTasks} icon={ListChecks} subtitle={`of ${tasks.length} open tasks`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QueueOverview claims={claims} />
        <AgingChart claims={claims} />
      </div>

      <HighPriorityTable claims={claims} />
    </div>
  );
}