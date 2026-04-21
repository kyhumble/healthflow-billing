import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { QUEUE_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ClaimActionPanel({ claim, user }) {
  const [status, setStatus] = useState(claim.status);
  const [queue, setQueue] = useState(claim.queue_name || 'unassigned');
  const [dueDate, setDueDate] = useState(claim.due_date || '');
  const queryClient = useQueryClient();

  const updateClaim = useMutation({
    mutationFn: (data) => base44.entities.Claim.update(claim.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', claim.id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Claim updated');
    },
  });

  const logAudit = async (action, oldVal, newVal) => {
    await base44.entities.AuditLog.create({
      entity_type: 'Claim',
      entity_id: claim.id,
      action,
      old_value: oldVal,
      new_value: newVal,
      performed_by_email: user?.email,
      performed_by_name: user?.full_name,
    });
  };

  const handleSave = async () => {
    const changes = {};
    if (status !== claim.status) changes.status = status;
    if (queue !== (claim.queue_name || 'unassigned')) changes.queue_name = queue;
    if (dueDate !== (claim.due_date || '')) changes.due_date = dueDate;
    changes.last_action_date = new Date().toISOString().split('T')[0];

    if (Object.keys(changes).length <= 1) return;

    const oldValues = { status: claim.status, queue_name: claim.queue_name, due_date: claim.due_date };
    await updateClaim.mutateAsync(changes);
    await logAudit('Claim Updated', oldValues, changes);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Queue</label>
          <Select value={queue} onValueChange={setQueue}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUEUE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <Button size="sm" className="w-full gap-2" onClick={handleSave} disabled={updateClaim.isPending}>
          <Save className="w-3.5 h-3.5" /> {updateClaim.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}