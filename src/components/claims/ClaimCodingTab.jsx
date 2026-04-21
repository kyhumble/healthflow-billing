import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, AlertTriangle, Code2 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

export default function ClaimCodingTab({ claimId, user }) {
  const queryClient = useQueryClient();

  const { data: procedures = [] } = useQuery({
    queryKey: ['claim-procedures', claimId],
    queryFn: () => base44.entities.Procedure.filter({ claim_id: claimId }),
  });

  const updateProcedure = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Procedure.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim-procedures', claimId] }),
  });

  const approveCoding = (proc) => {
    updateProcedure.mutate({
      id: proc.id,
      data: {
        review_status: 'approved',
        final_cpt: proc.final_cpt || proc.suggested_cpt,
        reviewer_email: user?.email,
      },
    });
  };

  const rejectCoding = (proc) => {
    updateProcedure.mutate({
      id: proc.id,
      data: { review_status: 'rejected', reviewer_email: user?.email },
    });
  };

  if (procedures.length === 0) {
    return <EmptyState icon={Code2} title="No Procedures" description="Procedures will appear here when coding data is available." />;
  }

  return (
    <div className="space-y-4">
      {procedures.map(proc => (
        <Card key={proc.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {proc.procedure_type || 'Procedure'}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  proc.review_status === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  proc.review_status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                  proc.review_status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {proc.review_status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {proc.review_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                {proc.review_status === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {proc.review_status || 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Wound Depth</p>
                <p className="font-medium">{proc.wound_depth || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Size (sq cm)</p>
                <p className="font-medium font-tabular">{proc.wound_size_sq_cm ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Time (min)</p>
                <p className="font-medium font-tabular">{proc.time_minutes ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Distinct Wounds</p>
                <p className="font-medium">{proc.distinct_wounds ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coding Suggestion</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Suggested CPT</p>
                  <p className="text-lg font-bold font-tabular text-primary">{proc.suggested_cpt || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modifier 1</p>
                  <p className="text-lg font-bold font-tabular">{proc.modifier_1 || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modifier 2</p>
                  <p className="text-lg font-bold font-tabular">{proc.modifier_2 || '—'}</p>
                </div>
              </div>
              {proc.suggestion_reasons?.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
                  {proc.suggestion_reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {proc.review_status === 'pending' && proc.requires_review && (
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" className="gap-1.5" onClick={() => approveCoding(proc)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => rejectCoding(proc)}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}

            {proc.final_cpt && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-1">Final CPT</p>
                <p className="text-lg font-bold font-tabular text-emerald-600">{proc.final_cpt}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}