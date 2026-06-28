export const mockDentists = [
  { id: 'dentist-1', name: 'Dr. Hamza Zahid', specialty: 'Chief Clinical Director & Surgeon', status: 'Active' },
  { id: 'dentist-2', name: 'Dr. Sarah Ahmed', specialty: 'Orthodontist & Pedodontist', status: 'Active' },
  { id: 'dentist-3', name: 'Dr. Ayesha Khan', specialty: 'Endodontist (Root Canal Specialist)', status: 'Active' },
];

export const mockPatients = [
  {
    id: 'pat-1',
    name: 'Muhammad Ali',
    gender: 'Male',
    dob: '1988-04-12',
    phone: '+92 300 1234567',
    email: 'm.ali@email.com',
    address: 'Flat 402, Block D, Gulshan-e-Iqbal, Karachi',
    allergies: 'Penicillin, Latex',
    status: 'Pending Payment',
    registrationDate: '2024-01-15',
    bloodGroup: 'O+'
  },
  {
    id: 'pat-2',
    name: 'Ayesha Siddiqua',
    gender: 'Female',
    dob: '1995-09-24',
    phone: '+92 321 9876543',
    email: 'ayesha.s@email.com',
    address: 'House 12, Street 5, F-7/2, Islamabad',
    allergies: 'None',
    status: 'Active',
    registrationDate: '2024-02-10',
    bloodGroup: 'A-'
  },
  {
    id: 'pat-3',
    name: 'Zainab Fatima',
    gender: 'Female',
    dob: '2001-11-05',
    phone: '+92 333 4567890',
    email: 'zainab.f@email.com',
    address: 'Apartment B-11, Phase 6, DHA, Lahore',
    allergies: 'Sulfa Drugs',
    status: 'Active',
    registrationDate: '2024-03-01',
    bloodGroup: 'B+'
  },
  {
    id: 'pat-4',
    name: 'Omar Farooq',
    gender: 'Male',
    dob: '1975-07-19',
    phone: '+92 312 8887776',
    email: 'omar.farooq@email.com',
    address: 'House 88-K, Model Town, Lahore',
    allergies: 'Aspirin',
    status: 'Old Patients',
    registrationDate: '2023-05-20',
    bloodGroup: 'AB+'
  },
  {
    id: 'pat-5',
    name: 'Bilal Khan',
    gender: 'Male',
    dob: '1992-12-30',
    phone: '+92 304 5556667',
    email: 'bilal.k@email.com',
    address: 'Sector G-9, Islamabad',
    allergies: 'None',
    status: 'Active',
    registrationDate: '2024-04-18',
    bloodGroup: 'O-'
  },
  {
    id: 'pat-6',
    name: 'Sana Malik',
    gender: 'Female',
    dob: '1990-02-14',
    phone: '+92 345 3334445',
    email: 'sana.malik@email.com',
    address: 'Clifton Block 5, Karachi',
    allergies: 'Local Anesthetics',
    status: 'Pending Payment',
    registrationDate: '2024-05-02',
    bloodGroup: 'A+'
  },
  {
    id: 'pat-7',
    name: 'Hamza Yousuf',
    gender: 'Male',
    dob: '2015-08-08',
    phone: '+92 320 2221110',
    email: 'yousuf.parents@email.com',
    address: 'Johar Town, Block H, Lahore',
    allergies: 'None',
    status: 'Active',
    registrationDate: '2024-05-15',
    bloodGroup: 'O+'
  },
  {
    id: 'pat-8',
    name: 'Fatima Zahra',
    gender: 'Female',
    dob: '1963-03-22',
    phone: '+92 301 7778889',
    email: 'fatima.z@email.com',
    address: 'Askari 11, Sector B, Lahore',
    allergies: 'Ibuprofen',
    status: 'Active',
    registrationDate: '2023-11-12',
    bloodGroup: 'B-'
  },
  {
    id: 'pat-9',
    name: 'Usman Ghani',
    gender: 'Male',
    dob: '1982-10-01',
    phone: '+92 334 9998887',
    email: 'usman.ghani@email.com',
    address: 'Gulberg III, Lahore',
    allergies: 'None',
    status: 'Old Patients',
    registrationDate: '2022-08-05',
    bloodGroup: 'AB-'
  },
  {
    id: 'pat-10',
    name: 'Amna Bibi',
    gender: 'Female',
    dob: '1978-05-15',
    phone: '+92 302 4443332',
    email: 'amna.bibi@email.com',
    address: 'Bahria Town, Sector C, Rawalpindi',
    allergies: 'None',
    status: 'Active',
    registrationDate: '2024-06-01',
    bloodGroup: 'A+'
  }
];

// Seed relative dates to keep mock data dynamic
const getRelativeDateString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const mockAppointments = [
  // Today's Appointments (2026-06-16)
  {
    id: 'appt-1',
    patientId: 'pat-1',
    patientName: 'Muhammad Ali',
    dentistId: 'dentist-1',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(0),
    time: '09:30 AM',
    type: 'Root Canal',
    status: 'Arrived',
    notes: 'Access cavity prep completed last visit. Today: obturation of distal root canal.'
  },
  {
    id: 'appt-2',
    patientId: 'pat-2',
    patientName: 'Ayesha Siddiqua',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(0),
    time: '11:00 AM',
    type: 'Crown',
    status: 'In Progress',
    notes: 'Crown placement for upper right molar (#16). Review occlusion.'
  },
  {
    id: 'appt-3',
    patientId: 'pat-3',
    patientName: 'Zainab Fatima',
    dentistId: 'dentist-3',
    dentistName: 'Dr. Ayesha Khan',
    date: getRelativeDateString(0),
    time: '01:30 PM',
    type: 'Scaling',
    status: 'Scheduled',
    notes: 'Routine 6-month cleaning and polishing.'
  },
  {
    id: 'appt-4',
    patientId: 'pat-5',
    patientName: 'Bilal Khan',
    dentistId: 'dentist-1',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(0),
    time: '03:00 PM',
    type: 'Filling',
    status: 'Completed',
    notes: 'Composite restoration on tooth #24 due to occlusal caries.'
  },
  {
    id: 'appt-5',
    patientId: 'pat-6',
    patientName: 'Sana Malik',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(0),
    time: '04:30 PM',
    type: 'Extraction',
    status: 'No Show',
    notes: 'Surgical extraction of impacted lower left wisdom tooth (#38).'
  },
  // Past Appointments
  {
    id: 'appt-6',
    patientId: 'pat-4',
    patientName: 'Omar Farooq',
    dentistId: 'dentist-1',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(-3),
    time: '10:00 AM',
    type: 'Extraction',
    status: 'Completed',
    notes: 'Simple extraction of mobile tooth #41 under local anesthesia.'
  },
  {
    id: 'appt-7',
    patientId: 'pat-8',
    patientName: 'Fatima Zahra',
    dentistId: 'dentist-3',
    dentistName: 'Dr. Ayesha Khan',
    date: getRelativeDateString(-5),
    time: '12:00 PM',
    type: 'Root Canal',
    status: 'Completed',
    notes: 'Pulpectomy and canal shaping for tooth #11. Patient tolerated well.'
  },
  {
    id: 'appt-8',
    patientId: 'pat-9',
    patientName: 'Usman Ghani',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(-10),
    time: '02:00 PM',
    type: 'Scaling',
    status: 'Completed',
    notes: 'Deep scaling and root planing in lower anterior sextant.'
  },
  // Future Appointments
  {
    id: 'appt-9',
    patientId: 'pat-10',
    patientName: 'Amna Bibi',
    dentistId: 'dentist-1',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(1),
    time: '09:00 AM',
    type: 'Crown',
    status: 'Scheduled',
    notes: 'Impression taking for PFM crown on #46.'
  },
  {
    id: 'appt-10',
    patientId: 'pat-7',
    patientName: 'Hamza Yousuf',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(2),
    time: '11:30 AM',
    type: 'Filling',
    status: 'Scheduled',
    notes: 'Glass ionomer restoration on tooth #54 (pediatric molar).'
  },
  {
    id: 'appt-11',
    patientId: 'pat-2',
    patientName: 'Ayesha Siddiqua',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(4),
    time: '03:30 PM',
    type: 'Scaling',
    status: 'Scheduled',
    notes: 'Follow-up gingival assessment and scaling.'
  }
];

export const mockTreatments = [
  {
    id: 'treat-1',
    patientId: 'pat-1',
    patientName: 'Muhammad Ali',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(-15),
    type: 'Root Canal',
    toothNumber: '36',
    cost: 12000,
    notes: 'First stage pulpectomy. Cleaned and shaped canals, placed calcium hydroxide.'
  },
  {
    id: 'treat-2',
    patientId: 'pat-4',
    patientName: 'Omar Farooq',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(-3),
    type: 'Extraction',
    toothNumber: '41',
    cost: 3500,
    notes: 'Surgical extraction due to severe periodontal mobility. Post-op instructions given.'
  },
  {
    id: 'treat-3',
    patientId: 'pat-8',
    patientName: 'Fatima Zahra',
    dentistName: 'Dr. Ayesha Khan',
    date: getRelativeDateString(-5),
    type: 'Root Canal',
    toothNumber: '11',
    cost: 15000,
    notes: 'Complete single-visit endodontic treatment with composite build-up.'
  },
  {
    id: 'treat-4',
    patientId: 'pat-9',
    patientName: 'Usman Ghani',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(-10),
    type: 'Scaling',
    toothNumber: 'All',
    cost: 4000,
    notes: 'Full mouth scaling and polishing with ultrasonic scaler.'
  },
  {
    id: 'treat-5',
    patientId: 'pat-5',
    patientName: 'Bilal Khan',
    dentistName: 'Dr. Hamza Zahid',
    date: getRelativeDateString(0),
    type: 'Filling',
    toothNumber: '24',
    cost: 5000,
    notes: 'Class II mesio-occlusal composite restoration. Shade A2.'
  },
  {
    id: 'treat-6',
    patientId: 'pat-6',
    patientName: 'Sana Malik',
    dentistName: 'Dr. Sarah Ahmed',
    date: getRelativeDateString(-25),
    type: 'Filling',
    toothNumber: '18',
    cost: 4500,
    notes: 'Amalgam restoration removed and replaced with microfilled hybrid composite.'
  }
];

export const mockInvoices = [
  {
    id: 'inv-1',
    patientId: 'pat-1',
    patientName: 'Muhammad Ali',
    invoiceNumber: 'INV-2026-001',
    date: getRelativeDateString(-15),
    dueDate: getRelativeDateString(-5),
    totalAmount: 12000,
    paidAmount: 6000,
    balanceDue: 6000,
    status: 'Partially Paid'
  },
  {
    id: 'inv-2',
    patientId: 'pat-4',
    patientName: 'Omar Farooq',
    invoiceNumber: 'INV-2026-002',
    date: getRelativeDateString(-3),
    dueDate: getRelativeDateString(7),
    totalAmount: 3500,
    paidAmount: 3500,
    balanceDue: 0,
    status: 'Paid'
  },
  {
    id: 'inv-3',
    patientId: 'pat-8',
    patientName: 'Fatima Zahra',
    invoiceNumber: 'INV-2026-003',
    date: getRelativeDateString(-5),
    dueDate: getRelativeDateString(5),
    totalAmount: 15000,
    paidAmount: 15000,
    balanceDue: 0,
    status: 'Paid'
  },
  {
    id: 'inv-4',
    patientId: 'pat-9',
    patientName: 'Usman Ghani',
    invoiceNumber: 'INV-2026-004',
    date: getRelativeDateString(-10),
    dueDate: getRelativeDateString(0),
    totalAmount: 4000,
    paidAmount: 4000,
    balanceDue: 0,
    status: 'Paid'
  },
  {
    id: 'inv-5',
    patientId: 'pat-5',
    patientName: 'Bilal Khan',
    invoiceNumber: 'INV-2026-005',
    date: getRelativeDateString(0),
    dueDate: getRelativeDateString(10),
    totalAmount: 5000,
    paidAmount: 5000,
    balanceDue: 0,
    status: 'Paid'
  },
  {
    id: 'inv-6',
    patientId: 'pat-6',
    patientName: 'Sana Malik',
    invoiceNumber: 'INV-2026-006',
    date: getRelativeDateString(-25),
    dueDate: getRelativeDateString(-15),
    totalAmount: 4500,
    paidAmount: 0,
    balanceDue: 4500,
    status: 'Unpaid'
  }
];

export const mockPayments = [
  {
    id: 'pay-1',
    invoiceId: 'inv-1',
    patientName: 'Muhammad Ali',
    date: getRelativeDateString(-15),
    amount: 6000,
    method: 'Cash'
  },
  {
    id: 'pay-2',
    invoiceId: 'inv-2',
    patientName: 'Omar Farooq',
    date: getRelativeDateString(-3),
    amount: 3500,
    method: 'Credit Card'
  },
  {
    id: 'pay-3',
    invoiceId: 'inv-3',
    patientName: 'Fatima Zahra',
    date: getRelativeDateString(-5),
    amount: 15000,
    method: 'Insurance'
  },
  {
    id: 'pay-4',
    invoiceId: 'inv-4',
    patientName: 'Usman Ghani',
    date: getRelativeDateString(-10),
    amount: 4000,
    method: 'Cash'
  },
  {
    id: 'pay-5',
    invoiceId: 'inv-5',
    patientName: 'Bilal Khan',
    date: getRelativeDateString(0),
    amount: 5000,
    method: 'Bank Transfer'
  }
];

export const mockPrescriptions = [
  {
    id: 'rx-1',
    patientName: 'Muhammad Ali',
    patientId: 'pat-1',
    medication: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '7 days',
    prescribedBy: 'Dr. Ahmed Khan',
    date: getRelativeDateString(-10),
    status: 'Active'
  },
  {
    id: 'rx-2',
    patientName: 'Fatima Zahra',
    patientId: 'pat-3',
    medication: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'Three times daily',
    duration: '5 days',
    prescribedBy: 'Dr. Ahmed Khan',
    date: getRelativeDateString(-5),
    status: 'Active'
  },
  {
    id: 'rx-3',
    patientName: 'Omar Farooq',
    patientId: 'pat-2',
    medication: 'Metronidazole',
    dosage: '200mg',
    frequency: 'Twice daily',
    duration: '10 days',
    prescribedBy: 'Dr. Zara Malik',
    date: getRelativeDateString(-15),
    status: 'Completed'
  }
];

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

export const mockTreatmentPlans = [
  {
    id: 'plan-1',
    patientId: 'pat-1',
    patientName: 'Muhammad Ali',
    dentistId: 'dentist-1',
    dentistName: 'Dr. Hamza Zahid',
    title: 'Full Mouth Rehabilitation',
    status: 'In Progress',
    createdDate: getRelativeDateString(-12),
    invoiceId: null,
    items: [
      { id: 'pli-1', procedure: 'Scaling', toothNumber: 'All', cost: 4000, done: true },
      { id: 'pli-2', procedure: 'Root Canal', toothNumber: '36', cost: 15000, done: true },
      { id: 'pli-3', procedure: 'Crown', toothNumber: '36', cost: 25000, done: false },
    ],
  },
  {
    id: 'plan-2',
    patientId: 'pat-3',
    patientName: 'Fatima Zahra',
    dentistId: 'dentist-2',
    dentistName: 'Dr. Sarah Ahmed',
    title: 'Cosmetic & Whitening Plan',
    status: 'Proposed',
    createdDate: getRelativeDateString(-2),
    invoiceId: null,
    items: [
      { id: 'pli-4', procedure: 'Consultation', toothNumber: '—', cost: 1500, done: false },
      { id: 'pli-5', procedure: 'Whitening', toothNumber: 'All', cost: 8000, done: false },
      { id: 'pli-6', procedure: 'Filling', toothNumber: '21', cost: 5000, done: false },
    ],
  },
];

// Master staff list. The 3 dentists keep their exact ids (dentist-1/2/3) so all
// existing references (appointments, treatments, plans) stay valid; dentists are
// derived from this list in ClinicContext.
export const mockStaff = [
  { id: 'dentist-1', name: 'Dr. Hamza Zahid', role: 'Dentist', specialty: 'Chief Clinical Director & Surgeon', email: 'hamza@dentsuite.com', phone: '+92 300 1112233', status: 'Active', joinedDate: '2021-03-01' },
  { id: 'dentist-2', name: 'Dr. Sarah Ahmed', role: 'Dentist', specialty: 'Orthodontist & Pedodontist', email: 'sarah@dentsuite.com', phone: '+92 301 2223344', status: 'Active', joinedDate: '2022-07-15' },
  { id: 'dentist-3', name: 'Dr. Ayesha Khan', role: 'Dentist', specialty: 'Endodontist (Root Canal Specialist)', email: 'ayesha@dentsuite.com', phone: '+92 302 3334455', status: 'Active', joinedDate: '2023-01-10' },
  { id: 'staff-1', name: 'Bilal Hussain', role: 'Receptionist', specialty: '', email: 'bilal@dentsuite.com', phone: '+92 303 4445566', status: 'Active', joinedDate: '2022-09-01' },
  { id: 'staff-2', name: 'Nadia Aslam', role: 'Dental Hygienist', specialty: 'Preventive Care', email: 'nadia@dentsuite.com', phone: '+92 304 5556677', status: 'Active', joinedDate: '2023-05-20' },
  { id: 'staff-3', name: 'Imran Sheikh', role: 'Lab Technician', specialty: 'Prosthetics & Crowns', email: 'imran@dentsuite.com', phone: '+92 305 6667788', status: 'On Leave', joinedDate: '2021-11-05' },
];

// External lab cases (crowns/bridges/dentures/aligners). Status lifecycle:
// Sent → In Progress → Received → Fitted. lab-3 is intentionally overdue.
export const mockLabCases = [
  { id: 'lab-1', patientId: 'pat-1', patientName: 'Muhammad Ali', dentistId: 'dentist-1', dentistName: 'Dr. Hamza Zahid', labName: 'Apex Dental Lab', caseType: 'Crown', toothNumber: '36', status: 'In Progress', cost: 9000, sentDate: getRelativeDateString(-6), dueDate: getRelativeDateString(2), receivedDate: null, notes: 'Shade A2, porcelain-fused-to-metal.' },
  { id: 'lab-2', patientId: 'pat-3', patientName: 'Fatima Zahra', dentistId: 'dentist-2', dentistName: 'Dr. Sarah Ahmed', labName: 'SmileCraft Prosthetics', caseType: 'Aligner', toothNumber: 'All', status: 'Sent', cost: 35000, sentDate: getRelativeDateString(-1), dueDate: getRelativeDateString(12), receivedDate: null, notes: 'Full-arch clear aligners — first set.' },
  { id: 'lab-3', patientId: 'pat-2', patientName: 'Omar Farooq', dentistId: 'dentist-3', dentistName: 'Dr. Ayesha Khan', labName: 'Apex Dental Lab', caseType: 'Bridge', toothNumber: '45', status: 'Sent', cost: 18000, sentDate: getRelativeDateString(-10), dueDate: getRelativeDateString(-2), receivedDate: null, notes: '3-unit bridge — chase the lab.' },
  { id: 'lab-4', patientId: 'pat-1', patientName: 'Muhammad Ali', dentistId: 'dentist-1', dentistName: 'Dr. Hamza Zahid', labName: 'PrecisionCeramics', caseType: 'Veneer', toothNumber: '11', status: 'Fitted', cost: 12000, sentDate: getRelativeDateString(-20), dueDate: getRelativeDateString(-12), receivedDate: getRelativeDateString(-13), notes: 'E-max veneer, fitted successfully.' },
];

// Patient recalls / reminders. Email-only (no SMS/WhatsApp). Lifecycle:
// Pending → Reminded → Completed (or Dismissed). rec-2 is intentionally overdue.
export const mockRecalls = [
  { id: 'rec-1', patientId: 'pat-1', patientName: 'Muhammad Ali', type: '6-Month Checkup', dueDate: getRelativeDateString(5), status: 'Pending', channel: 'Email', notes: 'Routine recall after root canal.', lastReminderAt: null },
  { id: 'rec-2', patientId: 'pat-2', patientName: 'Omar Farooq', type: 'Cleaning / Scaling', dueDate: getRelativeDateString(-3), status: 'Reminded', channel: 'Email', notes: '', lastReminderAt: getRelativeDateString(-1) },
  { id: 'rec-3', patientId: 'pat-3', patientName: 'Fatima Zahra', type: 'Ortho Adjustment', dueDate: getRelativeDateString(2), status: 'Pending', channel: 'Email', notes: 'Aligner set #2 due.', lastReminderAt: null },
  { id: 'rec-4', patientId: 'pat-1', patientName: 'Muhammad Ali', type: 'Whitening Touch-up', dueDate: getRelativeDateString(-20), status: 'Completed', channel: 'Email', notes: '', lastReminderAt: getRelativeDateString(-22) },
];

// Patient documents (X-rays, consent forms, scans, reports). Frontend-only:
// records hold file METADATA (name/type/size); actual bytes are not persisted.
export const mockDocuments = [
  { id: 'doc-1', patientId: 'pat-1', patientName: 'Muhammad Ali', name: 'Panoramic X-Ray.jpg', category: 'X-Ray', fileType: 'JPG', size: 2411724, uploadedDate: getRelativeDateString(-15), uploadedBy: 'Dr. Hamza Zahid', notes: 'Pre-RCT panoramic radiograph.' },
  { id: 'doc-2', patientId: 'pat-1', patientName: 'Muhammad Ali', name: 'Consent - Root Canal.pdf', category: 'Consent Form', fileType: 'PDF', size: 184320, uploadedDate: getRelativeDateString(-15), uploadedBy: 'Reception', notes: '' },
  { id: 'doc-3', patientId: 'pat-3', patientName: 'Fatima Zahra', name: 'CBCT Scan.pdf', category: 'Scan/CBCT', fileType: 'PDF', size: 8734512, uploadedDate: getRelativeDateString(-4), uploadedBy: 'Dr. Sarah Ahmed', notes: 'Orthodontic assessment.' },
  { id: 'doc-4', patientId: 'pat-2', patientName: 'Omar Farooq', name: 'Insurance Card.png', category: 'Insurance', fileType: 'PNG', size: 512000, uploadedDate: getRelativeDateString(-8), uploadedBy: 'Reception', notes: '' },
];
