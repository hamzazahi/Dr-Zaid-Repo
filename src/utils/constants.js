export const TREATMENT_TYPES = [
  'Consultation',
  'Filling',
  'Scaling',
  'Root Canal',
  'Extraction',
  'Crown',
  'Whitening',
  'Implant',
];

export const TREATMENT_COSTS = {
  Consultation: 1500,
  Filling: 5000,
  Scaling: 4000,
  'Root Canal': 15000,
  Extraction: 3500,
  Crown: 25000,
  Whitening: 8000,
  Implant: 45000,
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

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Insurance', 'Cheque'];

export const RECALL_CHANNELS = ['WhatsApp', 'SMS', 'Email'];

export const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => String(i + 1));
