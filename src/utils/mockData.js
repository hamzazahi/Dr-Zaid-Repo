export const mockDentists = [
  { id: 'dentist-1', name: 'Dr. Zaid', specialty: 'Chief Clinical Director & Surgeon', status: 'Active' },
  { id: 'dentist-2', name: 'Dr. Babar', specialty: 'General Dentist', status: 'Active' },
  { id: 'dentist-3', name: 'Dr. Afreen', specialty: 'General Dentist', status: 'Active' },
  { id: 'dentist-4', name: 'Dr. Iqra', specialty: 'General Dentist', status: 'Active' },
  { id: 'dentist-5', name: 'Dr. Aqsa', specialty: 'General Dentist', status: 'Active' },
];

export const mockPatients = [];

// Seed relative dates to keep mock data dynamic
const getRelativeDateString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const mockAppointments = [];

export const mockTreatments = [];

export const mockInvoices = [];

export const mockPayments = [];

export const mockPrescriptions = [];

export const mockInventory = [
  {
    id: 'inv-1',
    name: 'Composite Resin A2',
    category: 'Restorative Materials',
    supplier: 'Dental Supplies Plus',
    currentStock: 45,
    reorderLevel: 20,
    unitPrice: 1200,
    status: 'In Stock'
  },
  {
    id: 'inv-2',
    name: 'Dental Amalgam',
    category: 'Restorative Materials',
    supplier: 'Premium Dental Co.',
    currentStock: 15,
    reorderLevel: 20,
    unitPrice: 800,
    status: 'Low Stock'
  },
  {
    id: 'inv-3',
    name: 'Surgical Gloves (Box)',
    category: 'Protective Equipment',
    supplier: 'MediCare Supply',
    currentStock: 8,
    reorderLevel: 30,
    unitPrice: 450,
    status: 'Low Stock'
  },
  {
    id: 'inv-4',
    name: 'Impression Alginate',
    category: 'Materials',
    supplier: 'Dental Supplies Plus',
    currentStock: 0,
    reorderLevel: 10,
    unitPrice: 1500,
    status: 'Out of Stock'
  },
  {
    id: 'inv-5',
    name: 'Sterilization Pouches',
    category: 'Equipment',
    supplier: 'MediCare Supply',
    currentStock: 250,
    reorderLevel: 100,
    unitPrice: 25,
    status: 'In Stock'
  }
];

export const mockTreatmentPlans = [];

// Master staff list. The 3 dentists keep their exact ids (dentist-1/2/3) so all
// existing references (appointments, treatments, plans) stay valid; dentists are
// derived from this list in ClinicContext.
export const mockStaff = [
  { id: 'dentist-1', name: 'Dr. Zaid', role: 'Dentist', specialty: 'Chief Clinical Director & Surgeon', email: 'zaid@dentsuite.com', phone: '', status: 'Active', joinedDate: '2021-03-01' },
  { id: 'dentist-2', name: 'Dr. Babar', role: 'Dentist', specialty: 'General Dentist', email: 'babar@dentsuite.com', phone: '', status: 'Active', joinedDate: '2024-01-01' },
  { id: 'dentist-3', name: 'Dr. Afreen', role: 'Dentist', specialty: 'General Dentist', email: 'afreen@dentsuite.com', phone: '', status: 'Active', joinedDate: '2024-01-01' },
  { id: 'dentist-4', name: 'Dr. Iqra', role: 'Dentist', specialty: 'General Dentist', email: 'iqra@dentsuite.com', phone: '', status: 'Active', joinedDate: '2024-01-01' },
  { id: 'dentist-5', name: 'Dr. Aqsa', role: 'Dentist', specialty: 'General Dentist', email: 'aqsa@dentsuite.com', phone: '', status: 'Active', joinedDate: '2024-01-01' },
  { id: 'staff-1', name: 'Reception', role: 'Receptionist', specialty: '', email: 'reception@dentsuite.com', phone: '', status: 'Active', joinedDate: '2024-01-01' },
];

// External lab cases (crowns/bridges/dentures/aligners). Status lifecycle:
// Sent → In Progress → Received → Fitted. lab-3 is intentionally overdue.
export const mockLabCases = [];

// Patient recalls / reminders. Email-only (no SMS/WhatsApp). Lifecycle:
// Pending → Reminded → Completed (or Dismissed). rec-2 is intentionally overdue.
export const mockRecalls = [];

// Patient documents (X-rays, consent forms, scans, reports). Frontend-only:
// records hold file METADATA (name/type/size); actual bytes are not persisted.
export const mockDocuments = [];

// Clinic expenses (the spending side - separate from patient payments/income).
export const mockExpenses = [];

// Insurance claims. Lifecycle: Draft → Submitted → In Review → Approved/Denied → Paid.
export const mockClaims = [];

// Online booking requests (submitted via the public booking page). Confirming
// one creates a patient (if new) + a scheduled appointment.
export const mockBookingRequests = [];

// In-house membership plans (cash-pay alternative to insurance).
export const mockMembershipPlans = [
  { id: 'plan-basic', name: 'Basic Care', price: 6000, cycle: 'Annual', discount: 10, benefits: '2 cleanings, 1 exam, 1 X-ray per year', color: '#0D9488' },
  { id: 'plan-premium', name: 'Premium Care', price: 12000, cycle: 'Annual', discount: 20, benefits: '3 cleanings, 2 exams, X-rays & 1 whitening per year', color: '#0F4C81' },
  { id: 'plan-family', name: 'Family Plan', price: 20000, cycle: 'Annual', discount: 25, benefits: 'Up to 4 members, all Premium benefits included', color: '#7C3AED' },
];

// Patient enrollments. Effective status is computed (renewal < today = Expired).
export const mockMemberships = [];

// Digital form templates (intake questionnaires + consent forms).
export const mockFormTemplates = [
  { id: 'ft-1', name: 'New Patient Intake', category: 'Intake', description: 'Personal details, contact & insurance info', fields: 12 },
  { id: 'ft-2', name: 'Medical History', category: 'Intake', description: 'Conditions, medications & allergies', fields: 18 },
  { id: 'ft-3', name: 'Consent - Extraction', category: 'Consent', description: 'Informed consent for tooth extraction', fields: 5 },
  { id: 'ft-4', name: 'Consent - Root Canal', category: 'Consent', description: 'Informed consent for endodontic treatment', fields: 5 },
  { id: 'ft-5', name: 'Financial Agreement', category: 'Financial', description: 'Payment terms & responsibility', fields: 6 },
  { id: 'ft-6', name: 'Health Screening', category: 'Screening', description: 'Pre-visit health screening questionnaire', fields: 8 },
];

// Form submissions (assigned to patients). Pending → Completed (e-signed).
export const mockFormSubmissions = [];

// Audit log - append-only activity trail (compliance). Newest first.
export const mockAuditLog = [];

// Periodontal charts: per patient → per tooth → 6 pocket depths (MB,B,DB,ML,L,DL)
// + bleeding-on-probing flag. Seeded for pat-1 to demonstrate.
export const mockPerioCharts = {};

// Clinic locations (multi-branch). loc-1 is the primary site; staff without a
// locationId are treated as belonging to the primary location by default.
export const mockLocations = [
  { id: 'loc-1', name: 'Main Clinic - Gulshan', address: 'Plot 45-C, Block 5, Gulshan-e-Iqbal, Karachi', phone: '+92 21 3482 0011', email: 'gulshan@dentsuite.com', manager: 'Dr. Zaid', chairs: 4, openHours: 'Mon–Sat · 9 AM – 8 PM', status: 'Active', color: '#0F4C81', isPrimary: true },
  { id: 'loc-2', name: 'DHA Branch', address: '12th Commercial Street, DHA Phase 6, Karachi', phone: '+92 21 3584 7722', email: 'dha@dentsuite.com', manager: 'Dr. Sarah Ahmed', chairs: 2, openHours: 'Mon–Fri · 10 AM – 7 PM', status: 'Active', color: '#0D9488', isPrimary: false },
];

// Marketing campaigns (email-only, matching Recalls). Lifecycle: Draft → Sent.
// `recipients` is stamped at send time from the live audience segment size.
export const mockCampaigns = [
  { id: 'cmp-1', name: 'Whitening Month Offer', channel: 'Email', segment: 'All Patients', subject: '20% off teeth whitening this month ✨', body: 'Brighten your smile - book a whitening session this month and save 20%.', status: 'Sent', recipients: 10, createdDate: getRelativeDateString(-20), sentAt: getRelativeDateString(-18) },
  { id: 'cmp-2', name: 'Overdue Check-up Nudge', channel: 'Email', segment: 'Overdue Recalls', subject: 'Your dental check-up is overdue', body: 'Our records show your recall visit is overdue. Reply or call us to book a slot.', status: 'Sent', recipients: 2, createdDate: getRelativeDateString(-6), sentAt: getRelativeDateString(-5) },
  { id: 'cmp-3', name: 'Membership Plan Launch', channel: 'Email', segment: 'Active Patients', subject: 'Save up to 25% with DentSuite Care Plans', body: 'Introducing in-house membership plans - cleanings, exams and X-rays bundled at a flat yearly price.', status: 'Draft', recipients: 0, createdDate: getRelativeDateString(-1), sentAt: null },
];

// Imaging records (X-rays, scans, photos). Frontend-only: METADATA only - the
// actual image bytes are not stored (mirrors the Documents module).
export const mockImagingRecords = [];

// Two-way patient messaging (WhatsApp/SMS). Frontend-only: sends are simulated
// until a messaging gateway is connected in the backend phase.
export const mockConversations = [];

// Patient referrals. Outbound = we refer a patient to a specialist; Inbound =
// another provider sends a patient to us. Pending → Contacted → Scheduled →
// Completed (or Cancelled). Inbound referrals may arrive before the patient is
// registered, so patientId can be null with just a name.
export const mockReferrals = [];
