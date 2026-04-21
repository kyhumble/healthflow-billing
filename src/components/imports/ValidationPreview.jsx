import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Loader2, ChevronRight, ArrowLeft, CheckCircle2,
  AlertTriangle, XCircle, Info, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRowsFromExtractionResult } from '@/lib/importFileUtils';

// --- Validation rules ---
// Each rule: { field, label, severity: 'error'|'warning', test: (value, row) => string|null }
const RULES = [
  {
    field: 'patient_name',
    label: 'Missing patient name',
    severity: 'error',
    test: v => (!v || String(v).trim() === '') ? 'Patient name is blank' : null,
  },
  {
    field: 'dos',
    label: 'Missing / invalid date of service',
    severity: 'warning',
    test: v => {
      if (!v || String(v).trim() === '') return 'Date of service is blank';
      const d = new Date(v);
      if (isNaN(d.getTime())) return `"${v}" is not a valid date`;
      if (d > new Date()) return `Date of service is in the future (${v})`;
      return null;
    },
  },
  {
    field: 'patient_dob',
    label: 'Invalid date of birth',
    severity: 'warning',
    test: v => {
      if (!v || String(v).trim() === '') return null; // optional
      const d = new Date(v);
      if (isNaN(d.getTime())) return `"${v}" is not a valid date`;
      if (d > new Date()) return 'Date of birth is in the future';
      return null;
    },
  },
  {
    field: 'provider_npi',
    label: 'Malformed NPI number',
    severity: 'warning',
    test: v => {
      if (!v || String(v).trim() === '') return null; // optional
      const npi = String(v).replace(/\D/g, '');
      if (npi.length !== 10) return `NPI "${v}" must be exactly 10 digits (got ${npi.length})`;
      return null;
    },
  },
  {
    field: 'balance',
    label: 'Negative balance',
    severity: 'warning',
    test: v => {
      if (v == null || String(v).trim() === '') return null;
      const n = parseFloat(v);
      if (isNaN(n)) return `Balance "${v}" is not a valid number`;
      if (n < 0) return `Balance is negative (${v})`;
      return null;
    },
  },
  {
    field: 'charges',
    label: 'Invalid charges',
    severity: 'warning',
    test: v => {
      if (v == null || String(v).trim() === '') return null;
      const n = parseFloat(v);
      if (isNaN(n)) return `Charges "${v}" is not a valid number`;
      if (n < 0) return `Charges is negative (${v})`;
      return null;
    },
  },
  {
    field: 'payer_type',
    label: 'Unknown payer type',
    severity: 'info',
    test: v => {
      if (!v || String(v).trim() === '') return null;
      const valid = ['commercial','medicare','medicaid','tricare','workers_comp','self_pay','other'];
      if (!valid.includes(String(v).toLowerCase().replace(/\s+/g, '_')))
        return `Payer type "${v}" will be normalized to "other"`;
      return null;
    },
  },
];

const SEV_CONFIG = {
  error:   { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',   icon: XCircle,       badge: 'bg-red-50 text-red-700 border-red-200' },
  warning: { color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: AlertTriangle, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  info:    { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',  icon: Info,          badge: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function runValidation(rows) {
  // issues: [{ row: number, field: string, severity, message }]
  const issues = [];
  rows.forEach((row, idx) => {
    RULES.forEach(rule => {
      if (!(rule.field in row)) return; // field wasn't mapped, skip
      const msg = rule.test(row[rule.field], row);
      if (msg) issues.push({ row: idx + 1, field: rule.field, label: rule.label, severity: rule.severity, message: msg });
    });
  });
  return issues;
}

export default function ValidationPreview({ importRecord, onBack, onValidated }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all'); // all | error | warning | info

  useEffect(() => {
    (async () => {
      setLoading(true);
      const mapping = importRecord.column_mapping || {};
      // Build schema from mapped fields only
      const fieldProps = {};
      Object.entries(mapping).forEach(([, canonical]) => {
        fieldProps[canonical] = { type: 'string' };
      });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: importRecord.file_url,
        json_schema: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { type: 'object', properties: fieldProps },
              description: `Extract all rows. Map source columns to canonical names using: ${JSON.stringify(mapping)}`,
            },
          },
        },
      });
      const extracted = getRowsFromExtractionResult(result);
      if (extracted.length) {
        setRows(extracted);
        setIssues(runValidation(extracted));
      }
      setLoading(false);
    })();
  }, [importRecord]);

  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos    = issues.filter(i => i.severity === 'info');

  const filtered = filter === 'all' ? issues
    : filter === 'error' ? errors
    : filter === 'warning' ? warnings
    : infos;

  // Group issues by field for summary
  const byField = {};
  issues.forEach(i => {
    if (!byField[i.field]) byField[i.field] = { label: i.label, severity: i.severity, count: 0 };
    byField[i.field].count++;
  });

  const hasBlockers = errors.length > 0;
  const totalIssues = issues.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl bg-card">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Scanning data for quality issues…</p>
        <p className="text-xs text-muted-foreground">{importRecord.row_count > 0 ? `Checking ~${importRecord.row_count} rows` : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Validation Preview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rows.length} rows scanned · {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onBack}>
          <ArrowLeft className="w-3 h-3" /> Back to Mapping
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'error',   label: 'Errors',   count: errors.length,   desc: 'Will block import' },
          { key: 'warning', label: 'Warnings', count: warnings.length, desc: 'Review recommended' },
          { key: 'info',    label: 'Info',     count: infos.length,    desc: 'Will be normalized' },
        ].map(({ key, label, count, desc }) => {
          const cfg = SEV_CONFIG[key];
          const Icon = cfg.icon;
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(isActive ? 'all' : key)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                cfg.bg, cfg.border,
                isActive ? 'ring-2 ring-offset-1 ring-current' : 'hover:opacity-80',
                count === 0 && 'opacity-40 pointer-events-none'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', cfg.color)} />
                <span className={cn('text-xl font-bold tabular-nums', cfg.color)}>{count}</span>
              </div>
              <p className={cn('text-xs font-semibold', cfg.color)}>{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </button>
          );
        })}
      </div>

      {/* All clear */}
      {totalIssues === 0 && (
        <div className="flex items-center gap-3 border border-emerald-200 rounded-xl bg-emerald-50 px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All {rows.length} rows passed validation</p>
            <p className="text-xs text-emerald-700 mt-0.5">No data quality issues detected. Safe to proceed.</p>
          </div>
        </div>
      )}

      {/* Issue list */}
      {totalIssues > 0 && (
        <div className="border rounded-xl overflow-hidden bg-card">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30">
            {[
              { key: 'all', label: `All (${totalIssues})` },
              { key: 'error', label: `Errors (${errors.length})` },
              { key: 'warning', label: `Warnings (${warnings.length})` },
              { key: 'info', label: `Info (${infos.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  filter === tab.key
                    ? 'bg-background text-foreground shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-[11px] text-muted-foreground">{filtered.length} shown</span>
          </div>

          {/* Issue rows */}
          <div className="divide-y max-h-72 overflow-y-auto">
            {filtered.slice(0, 200).map((issue, i) => {
              const cfg = SEV_CONFIG[issue.severity];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                  <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{issue.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{issue.field}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-tabular shrink-0">row {issue.row}</span>
                </div>
              );
            })}
            {filtered.length > 200 && (
              <div className="px-4 py-2.5 text-xs text-muted-foreground text-center">
                Showing first 200 issues of {filtered.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocker notice */}
      {hasBlockers && (
        <div className="flex items-center gap-3 border border-red-200 rounded-xl bg-red-50 px-4 py-3">
          <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">
            <strong>{errors.length} error{errors.length !== 1 ? 's' : ''}</strong> must be fixed in the source file before importing. Fix the file, then re-upload.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onBack}>
          <ArrowLeft className="w-3 h-3" /> Back to Mapping
        </Button>

        <div className="flex items-center gap-3">
          {!hasBlockers && warnings.length > 0 && (
            <p className="text-xs text-amber-600">
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''} — rows will still be imported
            </p>
          )}
          <Button
            onClick={onValidated}
            disabled={hasBlockers}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            {hasBlockers ? 'Fix Errors First' : 'Proceed to Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
