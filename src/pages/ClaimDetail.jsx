import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge, QueueBadge, RiskBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/constants';
import ClaimOverviewTab from '@/components/claims/ClaimOverviewTab';
import ClaimNotesTab from '@/components/claims/ClaimNotesTab';
import ClaimTasksTab from '@/components/claims/ClaimTasksTab';
import ClaimCodingTab from '@/components/claims/ClaimCodingTab';
import ClaimAuditTab from '@/components/claims/ClaimAuditTab';
import ClaimActionPanel from '@/components/claims/ClaimActionPanel';

export default function ClaimDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      const claims = await base44.entities.Claim.filter({ id });
      return claims[0];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Claim not found.</p>
        <Link to="/claims" className="text-primary text-sm hover:underline mt-2 inline-block">Back to Claims</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/claims">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{claim.patient_name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={claim.status} />
              <QueueBadge queue={claim.queue_name} />
              <RiskBadge risk={claim.risk_level} />
              {claim.claim_number && <span className="text-xs text-muted-foreground">#{claim.claim_number}</span>}
              <span className="text-xs text-muted-foreground font-tabular font-semibold">
                {formatCurrency(claim.balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="coding" className="text-xs">Coding</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit Trail</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <ClaimOverviewTab claim={claim} />
          </TabsContent>
          <TabsContent value="coding" className="mt-4">
            <ClaimCodingTab claimId={claim.id} user={user} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <ClaimNotesTab claimId={claim.id} user={user} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-4">
            <ClaimTasksTab claimId={claim.id} user={user} />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <ClaimAuditTab claimId={claim.id} />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <ClaimActionPanel claim={claim} user={user} />
        </div>
      </div>
    </div>
  );
}