import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, RiskBadge, QueueBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/constants';
import { format } from 'date-fns';

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

export default function ClaimOverviewTab({ claim }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Patient & Encounter</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Patient" value={claim.patient_name} />
          <Field label="DOB" value={claim.patient_dob ? format(new Date(claim.patient_dob), 'MM/dd/yyyy') : null} />
          <Field label="MRN" value={claim.mrn} />
          <Field label="Date of Service" value={claim.dos ? format(new Date(claim.dos), 'MM/dd/yyyy') : null} />
          <Field label="Visit Type" value={claim.visit_type} />
          <Field label="Place of Service" value={claim.place_of_service} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Claim Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Claim Number" value={claim.claim_number} />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</p>
            <StatusBadge status={claim.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Queue</p>
            <QueueBadge queue={claim.queue_name} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
            <RiskBadge risk={claim.risk_level} />
          </div>
          <Field label="Priority Score" value={claim.priority_score || '0'} />
          <Field label="Owner" value={claim.owner_name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Financials</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Charges" value={formatCurrency(claim.charges)} />
          <Field label="Payments" value={formatCurrency(claim.payments)} />
          <Field label="Adjustments" value={formatCurrency(claim.adjustments)} />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
            <p className="text-lg font-bold text-primary font-tabular">{formatCurrency(claim.balance)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Payer & Provider</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Payer" value={claim.payer_name} />
          <Field label="Payer Type" value={claim.payer_type} />
          <Field label="Provider" value={claim.provider_name} />
          <Field label="NPI" value={claim.provider_npi} />
          {claim.denial_reason && <div className="col-span-2"><Field label="Denial Reason" value={claim.denial_reason} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}