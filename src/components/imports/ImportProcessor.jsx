import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { CANONICAL_FIELDS } from '@/lib/constants';
import { toast } from 'sonner';

function calculatePriorityScore(claim) {
  let score = 0;
  const balance = claim.balance || 0;
  if (balance >= 10000) score += 5;
  else if (balance >= 5000) score += 4;
  else if (balance >= 2500) score += 3;
  else if (balance >= 1000) score += 2;
  else score += 1;

  if (claim.dos) {
    const days = Math.floor((new Date() - new Date(claim.dos)) / (1000 * 60 * 60 * 24));
    if (days > 120) score += 5;
    else if (days > 60) score += 4;
    else if (days > 30) score += 3;
    else if (days > 14) score += 2;
    else score += 1;
  }
  return score;
}

function assignQueue(claim) {
  const s = (claim.status || '').toUpperCase();
  if (s === 'DENIED') return 'denials';
  if (['SUBMITTED', 'ACCEPTED', 'PROCESSING'].includes(s)) return 'follow_up';
  if (s === 'COB_ISSUE') return 'cob';
  if (s === 'NEEDS_INFO') return 'documentation';
  if (s === 'POSTING_EXCEPTION') return 'posting_exceptions';
  if (s === 'PROVIDER_ISSUE') return 'provider_enrollment';
  if (s === 'INTERNAL_REVIEW') return 'internal_review';
  if (s === 'READY_TO_BILL') return 'ready_to_bill';
  return 'unassigned';
}

function assignRisk(claim) {
  const balance = claim.balance || 0;
  if (balance >= 5000) return 'high';
  if (balance >= 1000) return 'medium';
  return 'low';
}

export default function ImportProcessor({ importRecord, onComplete }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const process = async () => {
    setProcessing(true);
    setProgress(10);

    await base44.entities.Import.update(importRecord.id, { status: 'processing' });

    // Extract data using mapping
    const mapping = importRecord.column_mapping || {};
    const cleanMapping = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v));
    const reverseMapping = {};
    Object.entries(cleanMapping).forEach(([source, canonical]) => {
      reverseMapping[canonical] = source;
    });

    setProgress(20);

    // Build target schema from the mapped fields
    const targetProps = {};
    CANONICAL_FIELDS.forEach(f => {
      if (reverseMapping[f.key]) {
        targetProps[f.key] = { type: f.type === 'number' ? 'number' : 'string', description: `Mapped from: ${reverseMapping[f.key]}` };
      }
    });

    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: importRecord.file_url,
      json_schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: { type: 'object', properties: targetProps },
            description: `Extract all rows. Map columns using: ${JSON.stringify(cleanMapping)}`,
          },
        },
      },
    });

    setProgress(60);

    if (extracted.status !== 'success' || !extracted.output?.rows) {
      await base44.entities.Import.update(importRecord.id, { status: 'failed', error_summary: [{ row: 0, field: 'file', message: 'Failed to extract data' }] });
      setResult({ success: 0, errors: 1 });
      setProcessing(false);
      return;
    }

    const rows = extracted.output.rows;
    let success = 0;
    let errors = 0;
    const errorSummary = [];

    // Create claims in batches
    const batch = [];
    for (const row of rows) {
      const claim = {
        ...row,
        import_id: importRecord.id,
        status: row.status ? row.status.toUpperCase().replace(/\s+/g, '_') : 'IMPORTED',
      };
      claim.queue_name = assignQueue(claim);
      claim.risk_level = assignRisk(claim);
      claim.priority_score = calculatePriorityScore(claim);
      claim.balance = parseFloat(claim.balance) || 0;
      claim.charges = parseFloat(claim.charges) || 0;
      claim.payments = parseFloat(claim.payments) || 0;
      claim.adjustments = parseFloat(claim.adjustments) || 0;
      batch.push(claim);
    }

    setProgress(75);

    // Bulk create claims in chunks
    const CHUNK = 50;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const chunk = batch.slice(i, i + CHUNK);
      try {
        await base44.entities.Claim.bulkCreate(chunk);
        success += chunk.length;
      } catch (err) {
        errors += chunk.length;
        errorSummary.push({ row: i, field: 'batch', message: err.message });
      }
      setProgress(75 + (25 * Math.min(i + CHUNK, batch.length) / batch.length));
    }

    const finalStatus = errors === 0 ? 'processed' : errors < batch.length ? 'partially_processed' : 'failed';
    await base44.entities.Import.update(importRecord.id, {
      status: finalStatus,
      processed_count: success,
      error_count: errors,
      row_count: rows.length,
      error_summary: errorSummary.length > 0 ? errorSummary : undefined,
    });

    setResult({ success, errors });
    setProcessing(false);
    setProgress(100);
    toast.success(`Imported ${success} claims`);
    onComplete();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Process Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will extract rows from <strong>{importRecord.file_name}</strong>, normalize them, assign queues and priorities, and create claim records.
        </p>

        {processing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
            </p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4">
            {result.errors === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{result.success} claims created successfully</p>
              {result.errors > 0 && <p className="text-xs text-red-600">{result.errors} rows had errors</p>}
            </div>
          </div>
        )}

        {!processing && !result && (
          <Button className="gap-2" onClick={process}>
            <Play className="w-4 h-4" /> Start Processing
          </Button>
        )}
      </CardContent>
    </Card>
  );
}