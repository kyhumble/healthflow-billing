import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

function PayerMappingsTab() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState('');
  const [normalized, setNormalized] = useState('');
  const [payerType, setPayerType] = useState('commercial');

  const { data: mappings = [] } = useQuery({
    queryKey: ['payer-mappings'],
    queryFn: () => base44.entities.PayerMapping.list('normalized_name'),
  });

  const create = useMutation({
    mutationFn: (d) => base44.entities.PayerMapping.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payer-mappings'] }); setSource(''); setNormalized(''); toast.success('Mapping added'); },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.PayerMapping.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payer-mappings'] }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Add Payer Mapping</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Name</label>
              <Input value={source} onChange={e => setSource(e.target.value)} className="h-8 text-sm" placeholder="e.g. UHC" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Normalized Name</label>
              <Input value={normalized} onChange={e => setNormalized(e.target.value)} className="h-8 text-sm" placeholder="e.g. United Healthcare" />
            </div>
            <div className="w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={payerType} onValueChange={setPayerType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['commercial', 'medicare', 'medicaid', 'tricare', 'workers_comp', 'self_pay', 'other'].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => create.mutate({ source_name: source, normalized_name: normalized, payer_type: payerType })} disabled={!source || !normalized}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead className="text-xs">Source</TableHead>
            <TableHead className="text-xs">Normalized</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs w-12" />
          </TableRow></TableHeader>
          <TableBody>
            {mappings.map(m => (
              <TableRow key={m.id}>
                <TableCell className="text-sm">{m.source_name}</TableCell>
                <TableCell className="text-sm font-medium">{m.normalized_name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{m.payer_type}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate(m.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {mappings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No payer mappings configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatusMappingsTab() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState('');
  const [normalized, setNormalized] = useState('IMPORTED');

  const { data: mappings = [] } = useQuery({
    queryKey: ['status-mappings'],
    queryFn: () => base44.entities.StatusMapping.list('source_status'),
  });

  const create = useMutation({
    mutationFn: (d) => base44.entities.StatusMapping.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['status-mappings'] }); setSource(''); toast.success('Mapping added'); },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.StatusMapping.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status-mappings'] }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Add Status Mapping</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Status</label>
              <Input value={source} onChange={e => setSource(e.target.value)} className="h-8 text-sm" placeholder="e.g. Pending" />
            </div>
            <div className="w-52">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Normalized Status</label>
              <Select value={normalized} onValueChange={setNormalized}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => create.mutate({ source_status: source, normalized_status: normalized })} disabled={!source}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead className="text-xs">Source Status</TableHead>
            <TableHead className="text-xs">Normalized Status</TableHead>
            <TableHead className="text-xs w-12" />
          </TableRow></TableHeader>
          <TableBody>
            {mappings.map(m => (
              <TableRow key={m.id}>
                <TableCell className="text-sm">{m.source_status}</TableCell>
                <TableCell className="text-sm font-medium">{STATUS_CONFIG[m.normalized_status]?.label || m.normalized_status}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate(m.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {mappings.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">No status mappings configured.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader><TableRow className="bg-muted/50">
          <TableHead className="text-xs">Name</TableHead>
          <TableHead className="text-xs">Email</TableHead>
          <TableHead className="text-xs">Role</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell className="text-sm font-medium">{u.full_name || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{u.role || 'user'}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function Admin() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Settings" description="Configure system mappings, rules, and users" />

      <Tabs defaultValue="payers">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payers" className="text-xs">Payer Mappings</TabsTrigger>
          <TabsTrigger value="statuses" className="text-xs">Status Mappings</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="payers" className="mt-4"><PayerMappingsTab /></TabsContent>
        <TabsContent value="statuses" className="mt-4"><StatusMappingsTab /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
      </Tabs>
    </div>
  );
}