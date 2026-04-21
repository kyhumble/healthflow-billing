import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CANONICAL_FIELDS } from '@/lib/constants';
import { ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ColumnMapper({ importRecord, onMapped }) {
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const extractHeaders = async () => {
      setLoading(true);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: importRecord.file_url,
        json_schema: {
          type: 'object',
          properties: {
            headers: { type: 'array', items: { type: 'string' }, description: 'List of all column headers in the file' },
            row_count: { type: 'number', description: 'Approximate number of data rows' },
          },
        },
      });
      if (result.status === 'success' && result.output) {
        setHeaders(result.output.headers || []);
        await base44.entities.Import.update(importRecord.id, { row_count: result.output.row_count || 0 });
      }
      setLoading(false);
    };
    extractHeaders();
  }, [importRecord]);

  const autoMap = async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Given these spreadsheet column headers: ${JSON.stringify(headers)}
      
Map them to these canonical field keys: ${CANONICAL_FIELDS.map(f => `${f.key} (${f.label})`).join(', ')}

Return a JSON object where keys are the source headers and values are the canonical field keys. Only include headers that clearly match a canonical field. If a header doesn't match anything, exclude it.`,
      response_json_schema: {
        type: 'object',
        properties: {
          mapping: {
            type: 'object',
            description: 'Object mapping source header names to canonical field keys',
          },
        },
      },
    });
    if (result?.mapping) {
      setMapping(result.mapping);
      toast.success('Auto-mapped columns');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Import.update(importRecord.id, {
      column_mapping: mapping,
      status: 'mapped',
    });
    setSaving(false);
    onMapped({ ...importRecord, column_mapping: mapping, status: 'mapped' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-sm">Analyzing file headers…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Map Columns</CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={autoMap}>
            <Wand2 className="w-3.5 h-3.5" /> Auto-Map
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Match your file's columns to the platform's standard fields.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {headers.map(header => (
          <div key={header} className="flex items-center gap-3 py-1.5">
            <span className="text-sm font-medium w-48 truncate" title={header}>{header}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Select
              value={mapping[header] || 'skip'}
              onValueChange={v => setMapping(prev => ({ ...prev, [header]: v === 'skip' ? undefined : v }))}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="Skip this column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">— Skip —</SelectItem>
                {CANONICAL_FIELDS.map(f => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Mapping & Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}