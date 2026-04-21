import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CANONICAL_FIELDS } from '@/lib/constants';
import {
  Loader2, Wand2, ArrowRight, CheckCircle2, AlertTriangle,
  XCircle, Info, Hash, Type, Calendar, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Fields required for a valid import
const REQUIRED_FIELDS = ['patient_name'];
const RECOMMENDED_FIELDS = ['dos', 'payer_name', 'balance', 'status', 'claim_number'];

const TYPE_ICONS = {
  string: Type,
  number: Hash,
  date: Calendar,
};

function FieldTypeIcon({ type }) {
  const Icon = TYPE_ICONS[type] || Type;
  return <Icon className="w-3 h-3" />;
}

function MappingRow({ header, sampleValue, mappedTo, usedKeys, onChange }) {
  const isDuplicate = mappedTo && usedKeys.filter(k => k === mappedTo).length > 1;
  const mappedField = CANONICAL_FIELDS.find(f => f.key === mappedTo);

  return (
    <div className={cn(
      'grid grid-cols-[1fr_32px_1fr] items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
      mappedTo && !isDuplicate ? 'border-primary/20 bg-primary/[0.03]' : 'border-border bg-card',
      isDuplicate && 'border-amber-300 bg-amber-50/50'
    )}>
      {/* Source column */}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" title={header}>{header}</p>
        {sampleValue != null && sampleValue !== '' && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={String(sampleValue)}>
            e.g. <span className="font-mono">{String(sampleValue)}</span>
          </p>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className={cn('w-4 h-4 flex-shrink-0', mappedTo ? 'text-primary' : 'text-muted-foreground/30')} />

      {/* Target field selector */}
      <div className="min-w-0">
        <Select value={mappedTo || 'skip'} onValueChange={v => onChange(v === 'skip' ? undefined : v)}>
          <SelectTrigger className={cn(
            'h-8 text-xs w-full',
            mappedTo && !isDuplicate && 'border-primary/30 text-foreground',
            isDuplicate && 'border-amber-400'
          )}>
            <SelectValue placeholder="Skip this column" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="skip">
              <span className="text-muted-foreground">— Skip this column —</span>
            </SelectItem>
            {CANONICAL_FIELDS.map(f => (
              <SelectItem key={f.key} value={f.key}>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground"><FieldTypeIcon type={f.type} /></span>
                  <span>{f.label}</span>
                  {REQUIRED_FIELDS.includes(f.key) && (
                    <span className="text-[10px] text-red-500 font-semibold">required</span>
                  )}
                  {RECOMMENDED_FIELDS.includes(f.key) && (
                    <span className="text-[10px] text-amber-500 font-semibold">recommended</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isDuplicate && (
          <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Mapped to same field as another column
          </p>
        )}
      </div>
    </div>
  );
}

function CoverageSummary({ mapping }) {
  const mappedKeys = Object.values(mapping).filter(Boolean);
  const requiredMet = REQUIRED_FIELDS.every(k => mappedKeys.includes(k));
  const recommendedCount = RECOMMENDED_FIELDS.filter(k => mappedKeys.includes(k)).length;
  const totalMapped = mappedKeys.length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className={cn(
        'rounded-lg border p-3 text-center',
        requiredMet ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
      )}>
        {requiredMet
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          : <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
        }
        <p className="text-xs font-semibold">{requiredMet ? 'Required Met' : 'Missing Required'}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">patient_name</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
        <p className="text-lg font-bold text-primary leading-none mb-1">{recommendedCount}/{RECOMMENDED_FIELDS.length}</p>
        <p className="text-xs font-semibold">Recommended</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">key fields mapped</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
        <p className="text-lg font-bold text-foreground leading-none mb-1">{totalMapped}</p>
        <p className="text-xs font-semibold">Total Mapped</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">columns included</p>
      </div>
    </div>
  );
}

function UnmappedRequiredAlert({ mapping }) {
  const mappedKeys = Object.values(mapping).filter(Boolean);
  const missing = REQUIRED_FIELDS.filter(k => !mappedKeys.includes(k));
  if (missing.length === 0) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold">Required fields not mapped: </span>
        {missing.map(k => CANONICAL_FIELDS.find(f => f.key === k)?.label).join(', ')}
      </div>
    </div>
  );
}

export default function ColumnMapper({ importRecord, onMapped }) {
  const [headers, setHeaders] = useState([]);
  const [sampleRow, setSampleRow] = useState({});
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoMapping, setAutoMapping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const extractHeaders = async () => {
      setLoading(true);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: importRecord.file_url,
        json_schema: {
          type: 'object',
          properties: {
            headers: { type: 'array', items: { type: 'string' }, description: 'All column header names from the file' },
            sample_row: { type: 'object', description: 'The first data row as key-value pairs (header → value)' },
            row_count: { type: 'number', description: 'Approximate number of data rows' },
          },
        },
      });
      if (result.status === 'success' && result.output) {
        setHeaders(result.output.headers || []);
        setSampleRow(result.output.sample_row || {});
        await base44.entities.Import.update(importRecord.id, { row_count: result.output.row_count || 0 });
      }
      setLoading(false);
    };
    extractHeaders();
  }, [importRecord]);

  const autoMap = async () => {
    setAutoMapping(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Map these spreadsheet column headers to canonical billing field keys.

Headers: ${JSON.stringify(headers)}
Sample row values: ${JSON.stringify(sampleRow)}

Canonical fields (key → label): ${CANONICAL_FIELDS.map(f => `${f.key}: ${f.label}`).join(', ')}

Return a mapping object where keys are the exact source headers and values are canonical field keys. Only include confident matches. Exclude headers that don't map.`,
      response_json_schema: {
        type: 'object',
        properties: {
          mapping: { type: 'object', description: 'Source header → canonical field key' },
        },
      },
    });
    setAutoMapping(false);
    if (result?.mapping) {
      setMapping(result.mapping);
      const count = Object.values(result.mapping).filter(Boolean).length;
      toast.success(`Auto-mapped ${count} columns`);
    }
  };

  const usedKeys = useMemo(() => Object.values(mapping).filter(Boolean), [mapping]);

  const hasDuplicates = usedKeys.length !== new Set(usedKeys).size;
  const canSave = REQUIRED_FIELDS.every(k => usedKeys.includes(k)) && !hasDuplicates;

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Import.update(importRecord.id, {
      column_mapping: mapping,
      status: 'mapped',
    });
    setSaving(false);
    onMapped({ ...importRecord, column_mapping: mapping, status: 'mapped' });
    toast.success('Column mapping saved');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">Analyzing file…</p>
            <p className="text-xs text-muted-foreground mt-1">Reading headers and sample data from <strong>{importRecord.file_name}</strong></p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Map Columns</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Found <strong>{headers.length}</strong> columns in <strong>{importRecord.file_name}</strong>.
                Match each to a database field, or skip columns you don't need.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
              onClick={autoMap}
              disabled={autoMapping}
            >
              {autoMapping
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Wand2 className="w-3.5 h-3.5" />
              }
              {autoMapping ? 'Mapping…' : 'Auto-Map with AI'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CoverageSummary mapping={mapping} />
        </CardContent>
      </Card>

      {/* Mapping rows */}
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-[1fr_32px_1fr] items-center gap-2 px-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your File Column</p>
            <span />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Field</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          {headers.map(header => (
            <MappingRow
              key={header}
              header={header}
              sampleValue={sampleRow[header]}
              mappedTo={mapping[header]}
              usedKeys={usedKeys}
              onChange={v => setMapping(prev => {
                const next = { ...prev };
                if (v == null) delete next[header];
                else next[header] = v;
                return next;
              })}
            />
          ))}
        </CardContent>
      </Card>

      {/* Validation + save */}
      <div className="space-y-3">
        <UnmappedRequiredAlert mapping={mapping} />

        {hasDuplicates && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Resolve duplicate mappings before continuing.
          </div>
        )}

        {!REQUIRED_FIELDS.every(k => usedKeys.includes(k)) || hasDuplicates ? null : (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Mapping looks good — ready to continue.
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {usedKeys.length} of {headers.length} columns will be imported
          </p>
          <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Confirm & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}