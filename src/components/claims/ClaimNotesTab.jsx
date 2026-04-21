import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus, MessageSquare } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'denial', label: 'Denial' },
  { value: 'coding', label: 'Coding' },
  { value: 'compliance', label: 'Compliance' },
];

export default function ClaimNotesTab({ claimId, user }) {
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [noteType, setNoteType] = useState('general');
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['claim-notes', claimId],
    queryFn: () => base44.entities.ClaimNote.filter({ claim_id: claimId }, '-created_date'),
  });

  const createNote = useMutation({
    mutationFn: (data) => base44.entities.ClaimNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-notes', claimId] });
      setBody('');
      setNoteType('general');
      setShowForm(false);
    },
  });

  const handleSubmit = () => {
    if (!body.trim()) return;
    createNote.mutate({
      claim_id: claimId,
      body: body.trim(),
      note_type: noteType,
      author_name: user?.full_name || 'Unknown',
      author_email: user?.email || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{notes.length} Notes</h3>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> Add Note
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write a note…"
              className="min-h-[80px] text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || createNote.isPending}>
                {createNote.isPending ? 'Saving…' : 'Save Note'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !showForm ? (
        <EmptyState icon={MessageSquare} title="No Notes" description="Add a note to track communication and updates." />
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{note.author_name || 'System'}</span>
                    <Badge variant="outline" className="text-[10px]">{note.note_type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.created_date), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}