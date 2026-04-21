import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CANONICAL_FIELDS } from '@/lib/constants';
import { Loader2, Wand2, ChevronRight, CheckCircle2, XCircle, RotateCcw, Hash, Type, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { extractCsvHeadersFromText, extractHeadersAndSample, getRowsFromExtractionResult } from '@/lib/importFileUtils';

const REQUIRED = ['patient_name'];
const RECOMMENDED = ['dos', 'payer_name', 'balance', 'status', 'claim_number'];

const TYPE_META = {
  string: { icon: Type, color: 'text-blue-500', bg: 'bg-blue-50' },
  number: { icon: Hash, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  date:   { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
};

export default function ColumnMapper({ importRecord, onMapped }) {
  const [headers, setHeaders] = useState([]);
  const [sampleRow, setSampleRow] = useState({});
  const [mapping, setMapping] = useState({}); // canonical_key -> source_header
  const [loading, setLoading] = useState(true);
  const [autoMapping, setAutoMapping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null); // currently selected source header
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        // Extract the first few rows — use the keys of the returned objects as headers
        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: importRecord.file_url,
          json_schema: {
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                description: 'Extract ALL rows from the spreadsheet. Each row should be an object where keys are the EXACT column header names from the file and values are the cell contents. Include every column.',
                items: { type: 'object' },
              },
            },
          },
        });
        const parsed = extractHeadersAndSample(getRowsFromExtractionResult(result));

        if (!parsed.headers.length && importRecord.file_type === 'csv') {
          const response = await fetch(importRecord.file_url);
          const csvText = await response.text();
          const csvHeaders = extractCsvHeadersFromText(csvText);
          parsed.headers = csvHeaders;
          parsed.sampleRow = {};
        }

        if (!parsed.headers.length) {
          setLoadError('No column headers were detected. Please upload a file with a header row.');
        }

        setHeaders(parsed.headers);
        setSampleRow(parsed.sampleRow);
        if (parsed.rowCount > 0) {
          await base44.entities.Import.update(importRecord.id, { row_count: parsed.rowCount });
        }
      } catch (err) {
        setLoadError(err?.message || 'We could not read columns from this file. Please re-upload and try again.');
      }
      setLoading(false);
    })();
  }, [importRecord]);

  // Reverse mapping: source_header -> canonical_key
  const reverseMapping = useMemo(() =>
    Object.fromEntries(Object.entries(mapping).map(([k, v]) => [v, k])),
    [mapping]
  );

  const mappedSourceHeaders = useMemo(() => new Set(Object.values(mapping)), [mapping]);
  const mappedCanonicalKeys = useMemo(() => new Set(Object.keys(mapping)), [mapping]);

  const assignMapping = (canonicalKey) => {
    if (!selected) return;
    setMapping(prev => {
      const next = { ...prev };
      // Remove any existing mapping to this source header
      Object.keys(next).forEach(k => { if (next[k] === selected) delete next[k]; });
      next[canonicalKey] = selected;
      return next;
    });
    setSelected(null);
  };

  const removeMapping = (canonicalKey, e) => {
    e.stopPropagation();
    setMapping(prev => { const n = { ...prev }; delete n[canonicalKey]; return n; });
  };

  const autoMap = async () => {
    setAutoMapping(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Map these spreadsheet column headers to canonical healthcare billing field keys.
Source headers: ${JSON.stringify(headers)}
Sample values from first row: ${JSON.stringify(sampleRow)}
Canonical fields (key → label): ${CANONICAL_FIELDS.map(f => `${f.key} → "${f.label}"`).join(', ')}

Rules:
- Return a JSON object where keys are canonical field keys and values are the EXACT source header string
- Only include matches you are confident about
- Use fuzzy/semantic matching (e.g. "Pt Name" → patient_name, "DOS" → dos, "Bal" → balance)
- Do not invent headers that aren't in the source list`,
      response_json_schema: {
        type: 'object',
        properties: {
          mapping: { type: 'object', description: 'canonical_key → source_header_name' },
        },
      },
    });
    setAutoMapping(false);
    if (result?.mapping) {
      const valid = Object.fromEntries(
        Object.entries(result.mapping).filter(([, v]) => headers.includes(v))
      );
      setMapping(valid);
      toast.success(`Auto-mapped ${Object.keys(valid).length} fields`);
    }
  };

  const requiredMet = REQUIRED.every(k => mappedCanonicalKeys.has(k));
  const canSave = requiredMet;
  const unmappedHeaders = headers.filter(h => !mappedSourceHeaders.has(h));

  const handleSave = async () => {
    setSaving(true);
    // Convert to source→canonical for storage
    const columnMapping = Object.fromEntries(Object.entries(mapping).map(([k, v]) => [v, k]));
    await base44.entities.Import.update(importRecord.id, { column_mapping: columnMapping, status: 'mapped' });
    setSaving(false);
    onMapped({ ...importRecord, column_mapping: columnMapping, status: 'mapped' });
    toast.success('Mapping saved');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl bg-card">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Reading columns from <strong className="text-foreground">{importRecord.file_name}</strong>…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Map Columns</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a source column, then click a target field to connect them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setMapping({}); setSelected(null); }}>
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={autoMap} disabled={autoMapping}>
            {autoMapping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {autoMapping ? 'Mapping…' : 'Auto-Map with AI'}
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* Main mapping canvas */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 border rounded-xl overflow-hidden bg-card">

        {/* LEFT — Source columns */}
        <div className="border-r">
          <div className="px-4 py-2.5 border-b bg-muted/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your File Columns</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{headers.length} columns · {unmappedHeaders.length} unmapped</p>
          </div>
          <div className="divide-y max-h-[420px] overflow-y-auto">
            {headers.map(header => {
              const isMapped = mappedSourceHeaders.has(header);
              const isSelected = selected === header;
              const mappedTo = reverseMapping[header];
              const targetField = CANONICAL_FIELDS.find(f => f.key === mappedTo);

              return (
                <button
                  key={header}
                  onClick={() => setSelected(isSelected ? null : header)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-sm',
                    isSelected && 'bg-primary/10 border-l-2 border-primary',
                    !isSelected && isMapped && 'bg-emerald-50/50',
                    !isSelected && !isMapped && 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium truncate', isSelected && 'text-primary')}>{header}</p>
                    {sampleRow[header] != null && sampleRow[header] !== '' && (
                      <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                        {String(sampleRow[header])}
                      </p>
                    )}
                  </div>
                  {isMapped && targetField && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      {targetField.label}
                    </Badge>
                  )}
                  {!isMapped && (
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">unmapped</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Target fields */}
        <div>
          <div className="px-4 py-2.5 border-b bg-muted/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Database Fields</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selected
                ? <span className="text-primary font-medium">← Click a field to map "{selected}"</span>
                : `${mappedCanonicalKeys.size} of ${CANONICAL_FIELDS.length} fields mapped`
              }
            </p>
          </div>
          <div className="divide-y max-h-[420px] overflow-y-auto">
            {CANONICAL_FIELDS.map(field => {
              const isMapped = mappedCanonicalKeys.has(field.key);
              const mappedHeader = mapping[field.key];
              const isRequired = REQUIRED.includes(field.key);
              const isRecommended = RECOMMENDED.includes(field.key);
              const meta = TYPE_META[field.type] || TYPE_META.string;
              const Icon = meta.icon;
              const canConnect = !!selected;

              return (
                <button
                  key={field.key}
                  onClick={() => canConnect ? assignMapping(field.key) : undefined}
                  disabled={!canConnect && !isMapped}
                  className={cn(
                    'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-sm',
                    canConnect && 'hover:bg-primary/5 cursor-pointer',
                    canConnect && isMapped && 'hover:bg-amber-50',
                    isMapped && !canConnect && 'bg-emerald-50/50',
                    !canConnect && !isMapped && 'opacity-50'
                  )}
                >
                  <div className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', meta.bg)}>
                    <Icon className={cn('w-3 h-3', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{field.label}</span>
                      {isRequired && <span className="text-[10px] text-red-500 font-bold">REQUIRED</span>}
                      {isRecommended && !isRequired && <span className="text-[10px] text-amber-500 font-semibold">recommended</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">{field.key}</p>
                  </div>
                  {isMapped ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 max-w-[100px] truncate">
                        {mappedHeader}
                      </Badge>
                      <button
                        onClick={(e) => removeMapping(field.key, e)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : canConnect ? (
                    <span className="text-[10px] text-primary/60 shrink-0">click to map</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / validation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {requiredMet ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Required fields mapped
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <XCircle className="w-3.5 h-3.5" />
              Patient Name is required
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {mappedCanonicalKeys.size} fields · {unmappedHeaders.length} source columns skipped
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Confirm & Continue'}
        </Button>
      </div>
    </div>
  );
}
