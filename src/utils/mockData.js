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

// Clinic expenses (the spending side — separate from patient payments/income).
export const mockExpenses = [
  { id: 'exp-1', date: getRelativeDateString(-2), category: 'Supplies', vendor: 'Dental Supplies Plus', description: 'Composite & consumables restock', amount: 42000, method: 'Bank Transfer', status: 'Paid' },
  { id: 'exp-2', date: getRelativeDateString(-5), category: 'Lab Fees', vendor: 'Apex Dental Lab', description: 'Crown & bridge cases', amount: 27000, method: 'Bank Transfer', status: 'Paid' },
  { id: 'exp-3', date: getRelativeDateString(-1), category: 'Utilities', vendor: 'K-Electric', description: 'Monthly electricity bill', amount: 18500, method: 'Cash', status: 'Pending' },
  { id: 'exp-4', date: getRelativeDateString(-8), category: 'Salaries', vendor: 'Payroll', description: 'Support staff salaries', amount: 120000, method: 'Bank Transfer', status: 'Paid' },
  { id: 'exp-5', date: getRelativeDateString(-15), category: 'Equipment', vendor: 'MediCare Supply', description: 'Autoclave servicing', amount: 9500, method: 'Credit Card', status: 'Paid' },
];

// Insurance claims. Lifecycle: Draft → Submitted → In Review → Approved/Denied → Paid.
export const mockClaims = [
  { id: 'clm-1', patientId: 'pat-3', patientName: 'Fatima Zahra', payer: 'Jubilee Health', policyNumber: 'JH-882140', serviceDate: getRelativeDateString(-12), submittedDate: getRelativeDateString(-10), procedures: 'Root canal + crown (tooth 36)', claimedAmount: 40000, approvedAmount: 32000, status: 'Approved', notes: '80% coverage approved.' },
  { id: 'clm-2', patientId: 'pat-2', patientName: 'Omar Farooq', payer: 'EFU Health', policyNumber: 'EFU-553201', serviceDate: getRelativeDateString(-6), submittedDate: getRelativeDateString(-5), procedures: 'Scaling & filling', claimedAmount: 9000, approvedAmount: 0, status: 'In Review', notes: '' },
  { id: 'clm-3', patientId: 'pat-1', patientName: 'Muhammad Ali', payer: 'State Life Insurance', policyNumber: 'SL-100923', serviceDate: getRelativeDateString(-3), submittedDate: getRelativeDateString(-2), procedures: 'Consultation + X-ray', claimedAmount: 3500, approvedAmount: 0, status: 'Submitted', notes: '' },
  { id: 'clm-4', patientId: 'pat-2', patientName: 'Omar Farooq', payer: 'Adamjee Insurance', policyNumber: 'ADJ-771500', serviceDate: getRelativeDateString(-25), submittedDate: getRelativeDateString(-22), procedures: 'Whitening (cosmetic)', claimedAmount: 8000, approvedAmount: 0, status: 'Denied', notes: 'Cosmetic — not covered.' },
];

// Online booking requests (submitted via the public booking page). Confirming
// one creates a patient (if new) + a scheduled appointment.
export const mockBookingRequests = [
  { id: 'bk-1', patientName: 'Sana Riaz', phone: '+92 333 1234567', email: 'sana.r@email.com', patientId: null, preferredDate: getRelativeDateString(2), preferredTime: '10:30 AM', service: 'Consultation', reason: 'Toothache on lower left side.', status: 'Pending', source: 'Online', submittedDate: getRelativeDateString(0), appointmentId: null },
  { id: 'bk-2', patientName: 'Muhammad Ali', phone: '+92 300 1234567', email: 'm.ali@email.com', patientId: 'pat-1', preferredDate: getRelativeDateString(3), preferredTime: '02:00 PM', service: 'Scaling', reason: 'Routine cleaning.', status: 'Pending', source: 'Online', submittedDate: getRelativeDateString(-1), appointmentId: null },
  { id: 'bk-3', patientName: 'Hassan Raza', phone: '+92 345 9876543', email: 'hassan@email.com', patientId: null, preferredDate: getRelativeDateString(-2), preferredTime: '11:00 AM', service: 'Whitening', reason: 'Cosmetic whitening enquiry.', status: 'Confirmed', source: 'Online', submittedDate: getRelativeDateString(-4), appointmentId: null },
];

// In-house membership plans (cash-pay alternative to insurance).
export const mockMembershipPlans = [
  { id: 'plan-basic', name: 'Basic Care', price: 6000, cycle: 'Annual', discount: 10, benefits: '2 cleanings, 1 exam, 1 X-ray per year', color: '#0D9488' },
  { id: 'plan-premium', name: 'Premium Care', price: 12000, cycle: 'Annual', discount: 20, benefits: '3 cleanings, 2 exams, X-rays & 1 whitening per year', color: '#0F4C81' },
  { id: 'plan-family', name: 'Family Plan', price: 20000, cycle: 'Annual', discount: 25, benefits: 'Up to 4 members, all Premium benefits included', color: '#7C3AED' },
];

// Patient enrollments. Effective status is computed (renewal < today = Expired).
export const mockMemberships = [
  { id: 'mem-1', patientId: 'pat-1', patientName: 'Muhammad Ali', planId: 'plan-premium', planName: 'Premium Care', cycle: 'Annual', startDate: getRelativeDateString(-120), renewalDate: getRelativeDateString(245), status: 'Active', price: 12000 },
  { id: 'mem-2', patientId: 'pat-2', patientName: 'Omar Farooq', planId: 'plan-basic', planName: 'Basic Care', cycle: 'Annual', startDate: getRelativeDateString(-350), renewalDate: getRelativeDateString(15), status: 'Active', price: 6000 },
  { id: 'mem-3', patientId: 'pat-3', patientName: 'Fatima Zahra', planId: 'plan-family', planName: 'Family Plan', cycle: 'Annual', startDate: getRelativeDateString(-400), renewalDate: getRelativeDateString(-35), status: 'Active', price: 20000 },
];

// Digital form templates (intake questionnaires + consent forms).
export const mockFormTemplates = [
  { id: 'ft-1', name: 'New Patient Intake', category: 'Intake', description: 'Personal details, contact & insurance info', fields: 12 },
  { id: 'ft-2', name: 'Medical History', category: 'Intake', description: 'Conditions, medications & allergies', fields: 18 },
  { id: 'ft-3', name: 'Consent — Extraction', category: 'Consent', description: 'Informed consent for tooth extraction', fields: 5 },
  { id: 'ft-4', name: 'Consent — Root Canal', category: 'Consent', description: 'Informed consent for endodontic treatment', fields: 5 },
  { id: 'ft-5', name: 'Financial Agreement', category: 'Financial', description: 'Payment terms & responsibility', fields: 6 },
  { id: 'ft-6', name: 'Health Screening', category: 'Screening', description: 'Pre-visit health screening questionnaire', fields: 8 },
];

// Form submissions (assigned to patients). Pending → Completed (e-signed).
export const mockFormSubmissions = [
  { id: 'fs-1', patientId: 'pat-1', patientName: 'Muhammad Ali', templateId: 'ft-2', templateName: 'Medical History', category: 'Intake', status: 'Completed', sentDate: getRelativeDateString(-16), completedDate: getRelativeDateString(-15), signedBy: 'Muhammad Ali', signatureDate: getRelativeDateString(-15) },
  { id: 'fs-2', patientId: 'pat-1', patientName: 'Muhammad Ali', templateId: 'ft-4', templateName: 'Consent — Root Canal', category: 'Consent', status: 'Completed', sentDate: getRelativeDateString(-15), completedDate: getRelativeDateString(-15), signedBy: 'Muhammad Ali', signatureDate: getRelativeDateString(-15) },
  { id: 'fs-3', patientId: 'pat-3', patientName: 'Fatima Zahra', templateId: 'ft-1', templateName: 'New Patient Intake', category: 'Intake', status: 'Pending', sentDate: getRelativeDateString(-1), completedDate: null, signedBy: null, signatureDate: null },
  { id: 'fs-4', patientId: 'pat-2', patientName: 'Omar Farooq', templateId: 'ft-3', templateName: 'Consent — Extraction', category: 'Consent', status: 'Pending', sentDate: getRelativeDateString(0), completedDate: null, signedBy: null, signatureDate: null },
];

// Audit log — append-only activity trail (compliance). Newest first.
export const mockAuditLog = [
  { id: 'aud-1', at: `${getRelativeDateString(0)}T09:12:00`, user: 'Dr. Hamza Zahid', module: 'Billing', action: 'Payment recorded', detail: 'Rs 5,000 received from Bilal Khan (Bank Transfer)' },
  { id: 'aud-2', at: `${getRelativeDateString(-1)}T16:40:00`, user: 'Reception', module: 'Appointments', action: 'Appointment scheduled', detail: 'Muhammad Ali — Scaling with Dr. Hamza Zahid' },
  { id: 'aud-3', at: `${getRelativeDateString(-1)}T11:05:00`, user: 'Dr. Sarah Ahmed', module: 'Clinical', action: 'Tooth charted', detail: 'Fatima Zahra — tooth 21 marked Filled' },
  { id: 'aud-4', at: `${getRelativeDateString(-2)}T14:22:00`, user: 'Dr. Hamza Zahid', module: 'Prescriptions', action: 'Prescription created', detail: 'Amoxicillin 500mg for Muhammad Ali' },
];

// Periodontal charts: per patient → per tooth → 6 pocket depths (MB,B,DB,ML,L,DL)
// + bleeding-on-probing flag. Seeded for pat-1 to demonstrate.
export const mockPerioCharts = {
  'pat-1': {
    18: { depths: [2, 3, 2, 3, 2, 3], bop: false },
    16: { depths: [3, 4, 3, 4, 5, 4], bop: true },
    11: { depths: [2, 2, 2, 2, 3, 2], bop: false },
    36: { depths: [5, 6, 5, 4, 3, 4], bop: true },
    46: { depths: [4, 3, 4, 3, 3, 4], bop: false },
  },
};

// Clinic locations (multi-branch). loc-1 is the primary site; staff without a
// locationId are treated as belonging to the primary location by default.
export const mockLocations = [
  { id: 'loc-1', name: 'Main Clinic — Gulshan', address: 'Plot 45-C, Block 5, Gulshan-e-Iqbal, Karachi', phone: '+92 21 3482 0011', email: 'gulshan@dentsuite.com', manager: 'Dr. Hamza Zahid', chairs: 4, openHours: 'Mon–Sat · 9 AM – 8 PM', status: 'Active', color: '#0F4C81', isPrimary: true },
  { id: 'loc-2', name: 'DHA Branch', address: '12th Commercial Street, DHA Phase 6, Karachi', phone: '+92 21 3584 7722', email: 'dha@dentsuite.com', manager: 'Dr. Sarah Ahmed', chairs: 2, openHours: 'Mon–Fri · 10 AM – 7 PM', status: 'Active', color: '#0D9488', isPrimary: false },
];

// Marketing campaigns (email-only, matching Recalls). Lifecycle: Draft → Sent.
// `recipients` is stamped at send time from the live audience segment size.
export const mockCampaigns = [
  { id: 'cmp-1', name: 'Whitening Month Offer', channel: 'Email', segment: 'All Patients', subject: '20% off teeth whitening this month ✨', body: 'Brighten your smile — book a whitening session this month and save 20%.', status: 'Sent', recipients: 10, createdDate: getRelativeDateString(-20), sentAt: getRelativeDateString(-18) },
  { id: 'cmp-2', name: 'Overdue Check-up Nudge', channel: 'Email', segment: 'Overdue Recalls', subject: 'Your dental check-up is overdue', body: 'Our records show your recall visit is overdue. Reply or call us to book a slot.', status: 'Sent', recipients: 2, createdDate: getRelativeDateString(-6), sentAt: getRelativeDateString(-5) },
  { id: 'cmp-3', name: 'Membership Plan Launch', channel: 'Email', segment: 'Active Patients', subject: 'Save up to 25% with DentSuite Care Plans', body: 'Introducing in-house membership plans — cleanings, exams and X-rays bundled at a flat yearly price.', status: 'Draft', recipients: 0, createdDate: getRelativeDateString(-1), sentAt: null },
];

// Imaging records (X-rays, scans, photos). Frontend-only: METADATA only — the
// actual image bytes are not stored (mirrors the Documents module).
export const mockImagingRecords = [
  { id: 'img-1', patientId: 'pat-1', patientName: 'Muhammad Ali', type: 'Periapical X-Ray', toothNumber: '36', date: getRelativeDateString(-15), takenBy: 'Dr. Hamza Zahid', notes: 'Pre-RCT — periapical radiolucency at mesial root.' },
  { id: 'img-2', patientId: 'pat-1', patientName: 'Muhammad Ali', type: 'Panoramic (OPG)', toothNumber: 'All', date: getRelativeDateString(-15), takenBy: 'Dr. Hamza Zahid', notes: 'Baseline panoramic radiograph.' },
  { id: 'img-3', patientId: 'pat-8', patientName: 'Fatima Zahra', type: 'CBCT Scan', toothNumber: 'All', date: getRelativeDateString(-4), takenBy: 'Dr. Sarah Ahmed', notes: '3D volume for endodontic assessment.' },
  { id: 'img-4', patientId: 'pat-4', patientName: 'Omar Farooq', type: 'Bitewing X-Ray', toothNumber: '45', date: getRelativeDateString(-8), takenBy: 'Dr. Ayesha Khan', notes: 'Interproximal caries check.' },
  { id: 'img-5', patientId: 'pat-5', patientName: 'Bilal Khan', type: 'Intraoral Photo', toothNumber: '24', date: getRelativeDateString(0), takenBy: 'Dr. Hamza Zahid', notes: 'Post-restoration photo of composite on #24.' },
];

// Two-way patient messaging (WhatsApp/SMS). Frontend-only: sends are simulated
// until a messaging gateway is connected in the backend phase.
export const mockConversations = [
  {
    id: 'conv-1', patientId: 'pat-1', patientName: 'Muhammad Ali', channel: 'WhatsApp', unread: true,
    messages: [
      { id: 'msg-1', from: 'clinic', text: 'Salaam Muhammad, a reminder of your root canal follow-up tomorrow at 9:30 AM with Dr. Hamza.', at: `${getRelativeDateString(-1)}T10:02:00` },
      { id: 'msg-2', from: 'patient', text: 'Thank you, I will be there inshAllah.', at: `${getRelativeDateString(-1)}T10:15:00` },
      { id: 'msg-3', from: 'patient', text: 'Is it okay if I come 15 minutes late? Traffic on Shahrah-e-Faisal.', at: `${getRelativeDateString(0)}T08:40:00` },
    ],
  },
  {
    id: 'conv-2', patientId: 'pat-6', patientName: 'Sana Malik', channel: 'SMS', unread: false,
    messages: [
      { id: 'msg-4', from: 'clinic', text: 'Hello Sana, we missed you at your extraction appointment today. Reply here or call us to reschedule.', at: `${getRelativeDateString(0)}T17:05:00` },
    ],
  },
  {
    id: 'conv-3', patientId: 'pat-2', patientName: 'Ayesha Siddiqua', channel: 'WhatsApp', unread: false,
    messages: [
      { id: 'msg-5', from: 'patient', text: 'Do you offer teeth whitening? What is the price?', at: `${getRelativeDateString(-2)}T14:20:00` },
      { id: 'msg-6', from: 'clinic', text: 'Yes! In-clinic whitening is Rs 8,000. Would you like to book a slot this week?', at: `${getRelativeDateString(-2)}T14:32:00` },
    ],
  },
];

// Patient referrals. Outbound = we refer a patient to a specialist; Inbound =
// another provider sends a patient to us. Pending → Contacted → Scheduled →
// Completed (or Cancelled). Inbound referrals may arrive before the patient is
// registered, so patientId can be null with just a name.
export const mockReferrals = [
  { id: 'ref-1', direction: 'Outbound', patientId: 'pat-8', patientName: 'Fatima Zahra', provider: 'Dr. Kamran Qureshi', practice: 'Karachi Maxillofacial Centre', specialty: 'Oral & Maxillofacial Surgery', reason: 'Impacted #38 — surgical extraction under GA.', date: getRelativeDateString(-7), status: 'Scheduled', notes: 'Surgery booked at KMC next week; report to follow.' },
  { id: 'ref-2', direction: 'Inbound', patientId: 'pat-5', patientName: 'Bilal Khan', provider: 'Dr. Naila Farhat', practice: 'City Family Clinic', specialty: 'General Practice', reason: 'Persistent gum bleeding — periodontal evaluation.', date: getRelativeDateString(-3), status: 'Contacted', notes: '' },
  { id: 'ref-3', direction: 'Outbound', patientId: 'pat-1', patientName: 'Muhammad Ali', provider: 'Dr. Adeel Mirza', practice: 'OrthoSmile Clinic', specialty: 'Orthodontics', reason: 'Lower anterior crowding — aligner assessment.', date: getRelativeDateString(-30), status: 'Completed', notes: 'Specialist report received; patient deferred treatment.' },
  { id: 'ref-4', direction: 'Inbound', patientId: null, patientName: 'Areeba Shah', provider: 'Dr. Salman Tariq', practice: 'Wellness GP Clinic', specialty: 'General Practice', reason: 'Suspected dental abscess, upper right quadrant.', date: getRelativeDateString(0), status: 'Pending', notes: 'New patient — register on arrival.' },
];
