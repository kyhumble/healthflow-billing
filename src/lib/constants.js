export const QUEUE_CONFIG = {
  ready_to_bill: { label: 'Ready to Bill', color: 'emerald', icon: 'CheckCircle2' },
  denials: { label: 'Denials', color: 'red', icon: 'XCircle' },
  follow_up: { label: 'Follow-Up', color: 'amber', icon: 'Clock' },
  cob: { label: 'COB', color: 'purple', icon: 'Layers' },
  documentation: { label: 'Documentation', color: 'blue', icon: 'FileText' },
  posting_exceptions: { label: 'Posting Exceptions', color: 'orange', icon: 'AlertTriangle' },
  provider_enrollment: { label: 'Provider Enrollment', color: 'cyan', icon: 'UserCheck' },
  internal_review: { label: 'Internal Review', color: 'slate', icon: 'Eye' },
  unassigned: { label: 'Unassigned', color: 'slate', icon: 'Inbox' },
};

export const STATUS_CONFIG = {
  IMPORTED: { label: 'Imported', color: 'slate' },
  READY_TO_BILL: { label: 'Ready to Bill', color: 'emerald' },
  SUBMITTED: { label: 'Submitted', color: 'blue' },
  ACCEPTED: { label: 'Accepted', color: 'cyan' },
  PROCESSING: { label: 'Processing', color: 'blue' },
  DENIED: { label: 'Denied', color: 'red' },
  PAID: { label: 'Paid', color: 'emerald' },
  CLOSED: { label: 'Closed', color: 'slate' },
  HELD: { label: 'Held', color: 'amber' },
  INTERNAL_REVIEW: { label: 'Internal Review', color: 'purple' },
  NEEDS_INFO: { label: 'Needs Info', color: 'amber' },
  COB_ISSUE: { label: 'COB Issue', color: 'purple' },
  POSTING_EXCEPTION: { label: 'Posting Exception', color: 'orange' },
  PROVIDER_ISSUE: { label: 'Provider Issue', color: 'rose' },
};

export const RISK_CONFIG = {
  low: { label: 'Low', color: 'emerald' },
  medium: { label: 'Medium', color: 'amber' },
  high: { label: 'High', color: 'red' },
};

export const ROLE_CONFIG = {
  admin: { label: 'Admin', permissions: ['all'] },
  billing_manager: { label: 'Billing Manager', permissions: ['view_all_claims', 'assign', 'override_priority', 'rebuild_queues', 'view_dashboard', 'resolve_exceptions'] },
  biller: { label: 'Biller / AR Specialist', permissions: ['view_assigned', 'update_status', 'add_notes', 'create_tasks', 'export'] },
  coding_reviewer: { label: 'Coding Reviewer', permissions: ['review_coding', 'approve_coding', 'add_modifiers', 'flag_docs'] },
  auditor: { label: 'Auditor / Compliance', permissions: ['view_history', 'view_audit', 'export_compliance'] },
  executive: { label: 'Executive', permissions: ['view_dashboard', 'export_summaries', 'read_only'] },
};

export const CANONICAL_FIELDS = [
  { key: 'patient_name', label: 'Patient Name', type: 'string' },
  { key: 'patient_dob', label: 'Patient DOB', type: 'date' },
  { key: 'mrn', label: 'MRN', type: 'string' },
  { key: 'claim_number', label: 'Claim Number', type: 'string' },
  { key: 'dos', label: 'Date of Service', type: 'date' },
  { key: 'payer_name', label: 'Payer Name', type: 'string' },
  { key: 'payer_type', label: 'Payer Type', type: 'string' },
  { key: 'provider_name', label: 'Provider Name', type: 'string' },
  { key: 'provider_npi', label: 'Provider NPI', type: 'string' },
  { key: 'status', label: 'Claim Status', type: 'string' },
  { key: 'balance', label: 'Balance', type: 'number' },
  { key: 'charges', label: 'Charges', type: 'number' },
  { key: 'payments', label: 'Payments', type: 'number' },
  { key: 'adjustments', label: 'Adjustments', type: 'number' },
  { key: 'denial_reason', label: 'Denial Reason', type: 'string' },
  { key: 'place_of_service', label: 'Place of Service', type: 'string' },
  { key: 'visit_type', label: 'Visit Type', type: 'string' },
];

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatCompactCurrency(value) {
  if (value == null || isNaN(value)) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return formatCurrency(value);
}