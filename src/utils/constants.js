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
