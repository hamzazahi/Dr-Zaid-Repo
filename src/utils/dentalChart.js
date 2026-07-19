// Dental charting (odontogram) domain logic - pure, UI-agnostic.
// Uses the Universal Numbering System (teeth 1–32) to stay consistent with
// `TOOTH_NUMBERS` and the `toothNumber` field already used on treatments.

// Tooth surfaces: Mesial, Occlusal, Distal, Buccal, Lingual.
export const SURFACES = ['M', 'O', 'D', 'B', 'L'];

export const SURFACE_LABELS = {
  M: 'Mesial',
  O: 'Occlusal',
  D: 'Distal',
  B: 'Buccal',
  L: 'Lingual',
};

// Clinical status catalogue. `surfaceBased` statuses let the dentist mark which
// surfaces are affected; `wholeTooth` statuses colour the entire tooth.
export const TOOTH_STATUS_META = {
  Healthy: { label: 'Healthy', color: '#10B981' },
  Caries: { label: 'Caries', color: '#EF4444', surfaceBased: true },
  Filled: { label: 'Filled', color: '#3B82F6', surfaceBased: true },
  Crown: { label: 'Crown', color: '#6366F1', wholeTooth: true },
  'Root Canal': { label: 'Root Canal', color: '#8B5CF6' },
  Bridge: { label: 'Bridge', color: '#6366F1', wholeTooth: true },
  Implant: { label: 'Implant', color: '#EC4899', wholeTooth: true },
  Missing: { label: 'Missing', color: '#9CA3AF' },
  'Extraction Needed': { label: 'Extraction Needed', color: '#DC2626' },
  Fractured: { label: 'Fractured', color: '#F97316' },
  Impacted: { label: 'Impacted', color: '#F59E0B' },
  Watch: { label: 'Watch', color: '#F59E0B', surfaceBased: true },
};

export const TOOTH_STATUSES = Object.keys(TOOTH_STATUS_META);

export const DEFAULT_STATUS = 'Healthy';

export const statusColor = (status) =>
  TOOTH_STATUS_META[status]?.color || '#E5E7EB';

export const statusLabel = (status) =>
  TOOTH_STATUS_META[status]?.label || status || 'Healthy';

export const isSurfaceStatus = (status) =>
  Boolean(TOOTH_STATUS_META[status]?.surfaceBased);

export const isWholeToothStatus = (status) =>
  Boolean(TOOTH_STATUS_META[status]?.wholeTooth);

// Compact legend list for the chart header.
export const LEGEND = [
  'Healthy',
  'Caries',
  'Filled',
  'Crown',
  'Root Canal',
  'Implant',
  'Watch',
  'Missing',
];

// Universal numbering split into the two arches. The lower arch is ordered
// 32→17 so it mirrors the upper arch left-to-right when rendered beneath it.
export const UPPER_ARCH = Array.from({ length: 16 }, (_, i) => i + 1); // 1–16
export const LOWER_ARCH = Array.from({ length: 16 }, (_, i) => 32 - i); // 32–17

// All 32 teeth in render order (upper then lower).
export const ALL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH];

// Map an existing treatment type to the tooth status it implies. Used to
// pre-populate the chart from treatment history before any manual edit.
const TREATMENT_STATUS_MAP = {
  Filling: 'Filled',
  Crown: 'Crown',
  'Root Canal': 'Root Canal',
  Extraction: 'Missing',
  Implant: 'Implant',
};

export const treatmentToToothStatus = (type) =>
  TREATMENT_STATUS_MAP[type] || null;

// Resolve the displayed record for a tooth: an explicit charted record wins;
// otherwise fall back to anything implied by the patient's treatments; else
// Healthy. Returns { status, surfaces, notes, derived }.
export const resolveToothRecord = (toothNumber, chart, treatments = []) => {
  const charted = chart?.[toothNumber];
  if (charted) return { ...charted, derived: false };

  const match = treatments.find(
    (t) => String(t.toothNumber) === String(toothNumber)
  );
  const derivedStatus = match ? treatmentToToothStatus(match.type) : null;
  return {
    status: derivedStatus || DEFAULT_STATUS,
    surfaces: '',
    // Only surface treatment notes when they actually drove a status change,
    // so a Healthy tooth doesn't inherit notes from an unrelated procedure.
    notes: derivedStatus ? match?.notes || '' : '',
    derived: Boolean(derivedStatus),
  };
};

// Aggregate counts for the summary strip (excludes Healthy).
export const summariseChart = (toothNumbers, chart, treatments = []) => {
  const counts = {};
  toothNumbers.forEach((n) => {
    const { status } = resolveToothRecord(n, chart, treatments);
    if (status !== DEFAULT_STATUS) counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
};
