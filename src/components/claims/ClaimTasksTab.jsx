import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus, CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react';
import { QUEUE_CONFIG } from '@/lib/constants';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

export default function ClaimTasksTab({ claimId, user }) {
  const [showForm, setShowForm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [queueName, setQueueName] = useState('follow_up');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['claim-tasks', claimId],
    queryFn: () => base44.entities.ClaimTask.filter({ claim_id: claimId }, '-created_date'),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.ClaimTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-tasks', claimId] });
      setActionType('');
      setDueDate('');
      setShowForm(false);
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClaimTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim-tasks', claimId] }),
  });

  const handleCreate = () => {
    if (!actionType.trim()) return;
    createTask.mutate({
      claim_id: claimId,
      action_type: actionType.trim(),
      queue_name: queueName,
      due_date: dueDate || undefined,
      status: 'open',
      owner_email: user?.email,
      owner_name: user?.full_name,
    });
  };

  const toggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    updateTask.mutate({
      id: task.id,
      data: { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null },
    });
  };

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'in_progress') return <Clock className="w-4 h-4 text-amber-500" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{tasks.filter(t => t.status !== 'completed').length} Open Tasks</h3>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> Add Task
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input value={actionType} onChange={e => setActionType(e.target.value)} placeholder="What needs to be done?" className="text-sm" />
            <div className="flex gap-3">
              <Select value={queueName} onValueChange={setQueueName}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUEUE_CONFIG).filter(([k]) => k !== 'unassigned').map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-40 h-8 text-xs" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!actionType.trim()}>Create Task</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && !showForm ? (
        <EmptyState icon={ListTodo} title="No Tasks" description="Create a task to track actions needed for this claim." />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <Card key={task.id} className={cn('hover:shadow-sm transition-shadow', task.status === 'completed' && 'opacity-60')}>
              <CardContent className="py-3 flex items-center gap-3">
                <button onClick={() => toggleComplete(task)} className="cursor-pointer flex-shrink-0">
                  {statusIcon(task.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through')}>
                    {task.action_type}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.queue_name && <Badge variant="outline" className="text-[10px]">{QUEUE_CONFIG[task.queue_name]?.label}</Badge>}
                    {task.due_date && (
                      <span className={cn('text-xs', new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                        Due {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
                {task.owner_name && <span className="text-xs text-muted-foreground">{task.owner_name}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}