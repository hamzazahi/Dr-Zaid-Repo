// Clinic fee schedule (price list). Editing a price here updates it everywhere:
// the procedure dropdown, the fee auto-fill, and the Fee Schedule card.
export const TREATMENT_TYPES = [
  'Consultation',
  'Filling',
  'Cap Cementation',
  'Crown Trimming',
  'Extraction (Normal)',
  'Extraction (Surgical)',
  'Wisdom Tooth Extraction',
  'Teeth Whitening',
  'Normal Crown',
  'Crown 3D PFM',
  'Crown Premium',
  'Crown Zirconia',
  // Implant stages
  'Implant Consultation & CBCT',
  'Bone Graft / Sinus Lift',
  'Implant Fixture Placement',
  'Healing Abutment',
  'Implant Impression / Scan',
  'Implant Crown',
  'Implant Review',
  // Orthodontic stages
  'Ortho Consultation & Records',
  'Separators / Banding',
  'Bracket Bonding',
  'Ortho Adjustment Visit',
  'Elastics / Auxiliaries',
  'Debonding',
  'Retainer Fitting',
  'Retention Review',
];

export const TREATMENT_COSTS = {
  'Consultation': 500,
  'Filling': 3000,
  'Cap Cementation': 1500,
  'Crown Trimming': 1000,
  'Extraction (Normal)': 3500,
  'Extraction (Surgical)': 10000,
  'Wisdom Tooth Extraction': 5000,
  'Teeth Whitening': 20000,
  'Normal Crown': 8000,
  'Crown 3D PFM': 12000,
  'Crown Premium': 15000,
  'Crown Zirconia': 25000,
  // ── Implant and orthodontic fees ───────────────────────────────────────────
  // PLACEHOLDERS at the clinic's usual scale - Dr. Zaid should replace these
  // with the real fee list. Every one of them is editable per plan, so a wrong
  // number here is a wrong default, never a wrong charge.
  'Implant Consultation & CBCT': 5000,
  'Bone Graft / Sinus Lift': 35000,
  'Implant Fixture Placement': 75000,
  'Healing Abutment': 10000,
  'Implant Impression / Scan': 5000,
  'Implant Crown': 45000,
  'Implant Review': 0,
  'Ortho Consultation & Records': 5000,
  'Separators / Banding': 8000,
  'Bracket Bonding': 60000,
  'Ortho Adjustment Visit': 3000,
  'Elastics / Auxiliaries': 5000,
  'Debonding': 10000,
  'Retainer Fitting': 15000,
  'Retention Review': 0,
};

// ── Treatment plan categories ────────────────────────────────────────────────
// Implant and ortho cases run as an ordered sequence, and parts of that
// sequence are waits (healing, osseointegration) rather than procedures. A
// template pre-fills the plan with the standard stages; the doctor edits,
// re-prices, adds or removes anything before saving.
export const PLAN_CATEGORIES = ['General', 'Implant', 'Ortho'];

export const PLAN_CATEGORY_COLORS = {
  General: { color: '#475569', bg: '#F1F5F9' },
  Implant: { color: '#0B7A70', bg: '#E4F4F1' },
  Ortho:   { color: '#6D34D6', bg: '#F0E9FD' },
};

const stage = (procedure, phase = 1, toothNumber = '-') => ({
  procedure,
  toothNumber,
  cost: TREATMENT_COSTS[procedure] ?? 0,
  kind: 'procedure',
  phase,
});
const wait = (procedure, phase = 1) => ({ procedure, toothNumber: '-', cost: 0, kind: 'wait', phase });

// Phase names. A case is presented and accepted a phase at a time, so each one
// is billed on its own rather than committing the patient to every stage months
// before it happens. A General plan is a single unnamed phase - the whole plan.
export const PLAN_PHASE_NAMES = {
  General: {},
  Implant: {
    1: 'Assessment & preparation',
    2: 'Implant placement',
    3: 'Restoration',
  },
  Ortho: {
    1: 'Records & planning',
    2: 'Active treatment',
    3: 'Debond & retention',
  },
};

// Standard sequences, offered as starting points. Waits carry no fee and are
// charted when healing is confirmed.
export const PLAN_TEMPLATES = {
  General: [],
  Implant: [
    stage('Implant Consultation & CBCT', 1),
    stage('Bone Graft / Sinus Lift', 1),
    wait('Healing after graft - 2 to 4 months', 1),
    stage('Implant Fixture Placement', 2),
    wait('Osseointegration - 3 to 6 months upper, 2 to 4 lower', 2),
    stage('Healing Abutment', 3),
    stage('Implant Impression / Scan', 3),
    stage('Implant Crown', 3),
    stage('Implant Review', 3),
  ],
  Ortho: [
    stage('Ortho Consultation & Records', 1, 'All'),
    stage('Separators / Banding', 2, 'All'),
    stage('Bracket Bonding', 2, 'All'),
    stage('Ortho Adjustment Visit', 2, 'All'),
    stage('Elastics / Auxiliaries', 2, 'All'),
    stage('Debonding', 3, 'All'),
    stage('Retainer Fitting', 3, 'All'),
    stage('Retention Review', 3, 'All'),
  ],
};

// Group a plan's items into ordered phases, each with its name, fee and how
// far through it is. A plan with everything in phase 1 comes back as one
// unnamed phase, which is exactly how plans behaved before phases existed.
export const groupPlanPhases = (plan) => {
  const names = PLAN_PHASE_NAMES[plan?.category] || {};
  const byPhase = new Map();
  (plan?.items || []).forEach((it) => {
    const n = Number(it.phase) || 1;
    if (!byPhase.has(n)) byPhase.set(n, []);
    byPhase.get(n).push(it);
  });
  return [...byPhase.keys()].sort((a, b) => a - b).map((n) => {
    const items = byPhase.get(n);
    const billable = items.filter((it) => it.kind !== 'wait');
    return {
      phase: n,
      name: names[n] || (byPhase.size > 1 ? `Phase ${n}` : ''),
      items,
      total: items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0),
      doneCount: items.filter((it) => it.done).length,
      billableCount: billable.length,
      invoiceId: (plan?.phases || []).find((ph) => Number(ph.phase) === n)?.invoiceId || null,
    };
  });
};

export const APPOINTMENT_STATUSES = [
  'Scheduled',
  'Arrived',
  'In Progress',
  'Completed',
  'No Show',
  'Cancelled',
];

export const PATIENT_STATUSES = ['Active', 'Pending Payment', 'Old Patients', 'Inactive'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Suggested payment methods. The field is editable, so staff can also type any
// other method (the list is just for quick picking).
export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'JazzCash', 'Easypaisa', 'Cheque', 'Insurance'];

export const RECALL_CHANNELS = ['Email'];

export const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => String(i + 1));
