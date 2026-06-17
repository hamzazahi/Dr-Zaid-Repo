import React, { createContext, useState, useContext } from 'react';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider = ({ children }) => {
  // 1. Roles
  const [roles] = useState([
    { RoleId: 1, RoleName: 'Admin', Description: 'Full system access — manage users, reports, settings' },
    { RoleId: 2, RoleName: 'Dentist', Description: 'Clinical access — charts, treatments, prescriptions' },
    { RoleId: 3, RoleName: 'Receptionist', Description: 'Front desk — appointments, billing, patient registration' },
    { RoleId: 4, RoleName: 'Assistant', Description: 'Chair-side — appointment view, chart notes' }
  ]);

  // 2. Users
  const [users, setUsers] = useState([
    { UserId: 1, Username: 'admin', FirstName: 'Admin', LastName: 'System', Phone: '555-0100', RoleId: 1, IsActive: true },
    { UserId: 2, Username: 'jdoe', FirstName: 'Jane', LastName: 'Doe', Phone: '555-0102', RoleId: 2, IsActive: true },
    { UserId: 3, Username: 'jsmith', FirstName: 'John', LastName: 'Smith', Phone: '555-0103', RoleId: 2, IsActive: true },
    { UserId: 4, Username: 'sconnor', FirstName: 'Sarah', LastName: 'Connor', Phone: '555-0104', RoleId: 3, IsActive: true },
    { UserId: 5, Username: 'tcruise', FirstName: 'Tom', LastName: 'Cruise', Phone: '555-0105', RoleId: 4, IsActive: true }
  ]);

  const [currentUser, setCurrentUser] = useState(users[1]); // Default to Dentist (Dr. Jane Doe) for clinical testing

  // 3. Patients
  const [patients, setPatients] = useState([
    {
      PatientId: 1,
      MRN: 'MRN-2026-00001',
      FirstName: 'John',
      LastName: 'Doe',
      DateOfBirth: '1985-05-12',
      Gender: 'M',
      Phone: '555-0201',
      Email: 'john.doe@example.com',
      Address: '123 Main St',
      City: 'Seattle',
      BloodGroup: 'O+',
      Allergies: 'Penicillin',
      MedicalHistory: 'Hypertension controlled with medication.',
      EmergencyContact: 'Jane Doe',
      EmergencyPhone: '555-0202',
      ReferredBy: 'Google Search',
      IsActive: true,
      CreatedAt: '2026-01-15T09:00:00Z',
      UpdatedAt: '2026-01-15T09:00:00Z',
      CreatedByUserId: 4
    },
    {
      PatientId: 2,
      MRN: 'MRN-2026-00002',
      FirstName: 'Alice',
      LastName: 'Johnson',
      DateOfBirth: '1992-09-23',
      Gender: 'F',
      Phone: '555-0301',
      Email: 'alice.j@example.com',
      Address: '456 Pine Rd',
      City: 'Seattle',
      BloodGroup: 'A-',
      Allergies: 'None',
      MedicalHistory: 'Asthma, carries inhaler.',
      EmergencyContact: 'Mark Johnson',
      EmergencyPhone: '555-0302',
      ReferredBy: 'Dr. John Smith',
      IsActive: true,
      CreatedAt: '2026-02-10T10:30:00Z',
      UpdatedAt: '2026-02-10T10:30:00Z',
      CreatedByUserId: 4
    },
    {
      PatientId: 3,
      MRN: 'MRN-2026-00003',
      FirstName: 'Robert',
      LastName: 'Williams',
      DateOfBirth: '1978-11-02',
      Gender: 'M',
      Phone: '555-0401',
      Email: 'bob.w@example.com',
      Address: '789 Elm St',
      City: 'Tacoma',
      BloodGroup: 'B+',
      Allergies: 'Sulfa Drugs',
      MedicalHistory: 'No major illnesses.',
      EmergencyContact: 'Susan Williams',
      EmergencyPhone: '555-0402',
      ReferredBy: 'Family Member',
      IsActive: true,
      CreatedAt: '2026-03-20T14:15:00Z',
      UpdatedAt: '2026-03-20T14:15:00Z',
      CreatedByUserId: 4
    }
  ]);

  // 4 & 5. Dental Charts & Tooth Records (Universal 32 teeth)
  // Initially we seed healthy teeth for patient 1, 2, 3
  const initialToothRecords = () => {
    const records = [];
    // ToothNumber from 1 to 32
    for (let t = 1; t <= 32; t++) {
      records.push({
        ToothRecordId: t,
        ChartId: 1, // Patient 1
        ToothNumber: t,
        Surface: null,
        ToothStatus: 'Healthy',
        Notes: '',
        UpdatedByUserId: 2,
        RecordedAt: '2026-01-15T09:30:00Z'
      });
    }
    // Let's add some caries to patient 1 for demonstration
    records[13].ToothStatus = 'Caries'; // Tooth 14
    records[13].Surface = 'O';
    records[13].Notes = 'Deep occlusal decay, pulp not exposed yet.';

    records[18].ToothStatus = 'Filled'; // Tooth 19
    records[18].Surface = 'MO';
    records[18].Notes = 'Old composite filling, looks stable.';

    records[29].ToothStatus = 'Missing'; // Tooth 30
    records[29].Notes = 'Extracted in 2022.';
    return records;
  };

  const [dentalCharts, setDentalCharts] = useState([
    { ChartId: 1, PatientId: 1, Notes: 'Initial clinical assessment completed.', CreatedAt: '2026-01-15T09:30:00Z' },
    { ChartId: 2, PatientId: 2, Notes: 'Patient has good oral hygiene.', CreatedAt: '2026-02-10T11:00:00Z' },
    { ChartId: 3, PatientId: 3, Notes: 'Heavy calculus build-up, needs scaling.', CreatedAt: '2026-03-20T14:45:00Z' }
  ]);

  const [toothRecords, setToothRecords] = useState(() => {
    // Generate tooth records for all 3 charts
    const p1Records = initialToothRecords();
    const p2Records = [];
    for (let t = 1; t <= 32; t++) {
      p2Records.push({
        ToothRecordId: 32 + t,
        ChartId: 2,
        ToothNumber: t,
        Surface: null,
        ToothStatus: 'Healthy',
        Notes: '',
        UpdatedByUserId: 2,
        RecordedAt: '2026-02-10T11:00:00Z'
      });
    }
    const p3Records = [];
    for (let t = 1; t <= 32; t++) {
      p3Records.push({
        ToothRecordId: 64 + t,
        ChartId: 3,
        ToothNumber: t,
        Surface: null,
        ToothStatus: t === 3 ? 'Caries' : 'Healthy',
        Surface: t === 3 ? 'D' : null,
        Notes: t === 3 ? 'Distal cavity' : '',
        UpdatedByUserId: 3,
        RecordedAt: '2026-03-20T14:45:00Z'
      });
    }
    return [...p1Records, ...p2Records, ...p3Records];
  });

  // 6. Tooth History
  const [toothHistory, setToothHistory] = useState([
    { HistoryId: 1, ToothRecordId: 14, PreviousStatus: 'Healthy', NewStatus: 'Caries', PreviousSurface: null, NewSurface: 'O', Notes: 'Caries detected during initial checkup', ChangedByUserId: 2, ChangedAt: '2026-01-15T09:30:00Z' },
    { HistoryId: 2, ToothRecordId: 19, PreviousStatus: 'Healthy', NewStatus: 'Filled', PreviousSurface: null, NewSurface: 'MO', Notes: 'Filled by previous dentist', ChangedByUserId: 2, ChangedAt: '2026-01-15T09:30:00Z' }
  ]);

  // 7. Procedure Categories
  const [procedureCategories] = useState([
    { CategoryId: 1, CategoryName: 'Diagnostic', Description: 'Examinations, X-rays, consultations' },
    { CategoryId: 2, CategoryName: 'Preventive', Description: 'Cleanings, fluoride, sealants' },
    { CategoryId: 3, CategoryName: 'Restorative', Description: 'Fillings, build-ups, inlays/onlays' },
    { CategoryId: 4, CategoryName: 'Endodontics', Description: 'Root canal treatment' },
    { CategoryId: 5, CategoryName: 'Periodontics', Description: 'Gum treatment, scaling' },
    { CategoryId: 6, CategoryName: 'Oral Surgery', Description: 'Extractions, implants' },
    { CategoryId: 7, CategoryName: 'Prosthodontics', Description: 'Crowns, bridges, dentures' },
    { CategoryId: 8, CategoryName: 'Orthodontics', Description: 'Braces, aligners' },
    { CategoryId: 9, CategoryName: 'Cosmetic', Description: 'Whitening, veneers, bonding' }
  ]);

  // 8. Procedures
  const [procedures, setProcedures] = useState([
    { ProcedureId: 1, ProcedureCode: 'D0120', ProcedureName: 'Periodic oral evaluation', CategoryId: 1, DefaultCost: 80.0, DefaultDurationMinutes: 20 },
    { ProcedureId: 2, ProcedureCode: 'D0150', ProcedureName: 'Comprehensive oral evaluation', CategoryId: 1, DefaultCost: 120.0, DefaultDurationMinutes: 40 },
    { ProcedureId: 3, ProcedureCode: 'D0210', ProcedureName: 'Full-mouth X-rays (FMX)', CategoryId: 1, DefaultCost: 250.0, DefaultDurationMinutes: 20 },
    { ProcedureId: 4, ProcedureCode: 'D0330', ProcedureName: 'Panoramic radiograph', CategoryId: 1, DefaultCost: 150.0, DefaultDurationMinutes: 15 },
    { ProcedureId: 5, ProcedureCode: 'D1110', ProcedureName: 'Prophylaxis (adult cleaning)', CategoryId: 2, DefaultCost: 200.0, DefaultDurationMinutes: 45 },
    { ProcedureId: 6, ProcedureCode: 'D1120', ProcedureName: 'Prophylaxis (child cleaning)', CategoryId: 2, DefaultCost: 120.0, DefaultDurationMinutes: 30 },
    { ProcedureId: 7, ProcedureCode: 'D2140', ProcedureName: 'Amalgam filling — 1 surface', CategoryId: 3, DefaultCost: 250.0, DefaultDurationMinutes: 45 },
    { ProcedureId: 8, ProcedureCode: 'D2330', ProcedureName: 'Composite filling — 1 surface', CategoryId: 3, DefaultCost: 350.0, DefaultDurationMinutes: 45 },
    { ProcedureId: 9, ProcedureCode: 'D2740', ProcedureName: 'Porcelain crown', CategoryId: 7, DefaultCost: 1800.0, DefaultDurationMinutes: 90 },
    { ProcedureId: 10, ProcedureCode: 'D2950', ProcedureName: 'Core build-up', CategoryId: 3, DefaultCost: 500.0, DefaultDurationMinutes: 30 },
    { ProcedureId: 11, ProcedureCode: 'D3310', ProcedureName: 'Root canal — anterior', CategoryId: 4, DefaultCost: 1200.0, DefaultDurationMinutes: 90 },
    { ProcedureId: 12, ProcedureCode: 'D3330', ProcedureName: 'Root canal — molar', CategoryId: 4, DefaultCost: 1800.0, DefaultDurationMinutes: 120 },
    { ProcedureId: 13, ProcedureCode: 'D4341', ProcedureName: 'Scaling & root planing — quad', CategoryId: 5, DefaultCost: 600.0, DefaultDurationMinutes: 60 },
    { ProcedureId: 14, ProcedureCode: 'D7140', ProcedureName: 'Extraction — erupted tooth', CategoryId: 6, DefaultCost: 500.0, DefaultDurationMinutes: 30 },
    { ProcedureId: 15, ProcedureCode: 'D7210', ProcedureName: 'Surgical extraction', CategoryId: 6, DefaultCost: 1000.0, DefaultDurationMinutes: 60 },
    { ProcedureId: 16, ProcedureCode: 'D6010', ProcedureName: 'Implant — surgical placement', CategoryId: 6, DefaultCost: 5000.0, DefaultDurationMinutes: 120 },
    { ProcedureId: 17, ProcedureCode: 'D6065', ProcedureName: 'Implant crown', CategoryId: 7, DefaultCost: 3500.0, DefaultDurationMinutes: 60 },
    { ProcedureId: 18, ProcedureCode: 'D9930', ProcedureName: 'Teeth whitening (in-office)', CategoryId: 9, DefaultCost: 1500.0, DefaultDurationMinutes: 90 }
  ]);

  // 9. Appointments
  const [appointments, setAppointments] = useState([
    {
      AppointmentId: 1,
      PatientId: 1,
      DentistUserId: 2, // Jane Doe
      AssistantUserId: 5, // Tom Cruise
      AppointmentDate: '2026-06-15T10:00:00', // Today
      DurationMinutes: 45,
      Status: 'Confirmed',
      AppointmentType: 'Checkup & Cleaning',
      ChiefComplaint: 'Routine checkup, feeling slight sensitivity on back upper left.',
      ClinicalNotes: 'Completed adult cleaning. Inspected Tooth #14 (O) Caries. Recommended filling next week.',
      FollowUpDate: '2026-06-22',
      ReminderSent: true,
      CreatedByUserId: 4,
      CreatedAt: '2026-06-10T09:00:00Z',
      UpdatedAt: '2026-06-15T10:45:00Z'
    },
    {
      AppointmentId: 2,
      PatientId: 2,
      DentistUserId: 2,
      AssistantUserId: null,
      AppointmentDate: '2026-06-15T14:30:00', // Today
      DurationMinutes: 60,
      Status: 'Completed',
      AppointmentType: 'Consultation',
      ChiefComplaint: 'Interested in teeth whitening options.',
      ClinicalNotes: 'Evaluated patient suitability for whitening. Discussed pricing and procedure code D9930. Patient agreed to schedule next month.',
      FollowUpDate: null,
      ReminderSent: true,
      CreatedByUserId: 4,
      CreatedAt: '2026-06-12T11:00:00Z',
      UpdatedAt: '2026-06-15T15:30:00Z'
    },
    {
      AppointmentId: 3,
      PatientId: 3,
      DentistUserId: 3, // John Smith
      AssistantUserId: 5,
      AppointmentDate: '2026-06-16T11:00:00', // Tomorrow
      DurationMinutes: 90,
      Status: 'Scheduled',
      AppointmentType: 'Scaling & Planing',
      ChiefComplaint: 'Bleeding gums when brushing.',
      ClinicalNotes: null,
      FollowUpDate: null,
      ReminderSent: false,
      CreatedByUserId: 4,
      CreatedAt: '2026-06-13T14:00:00Z',
      UpdatedAt: '2026-06-13T14:00:00Z'
    }
  ]);

  // 10. Treatment Plans
  const [treatmentPlans, setTreatmentPlans] = useState([
    {
      TreatmentPlanId: 1,
      PatientId: 1,
      DentistUserId: 2,
      PlanName: 'Composite Filling & Crown Plan',
      Status: 'Draft',
      TotalEstimatedCost: 2150.0, // filling D2330 ($350) + crown D2740 ($1800)
      Notes: 'Plan generated to treat caries on tooth 14 and restore missing molar site.',
      CreatedAt: '2026-06-15T10:45:00Z',
      UpdatedAt: '2026-06-15T10:45:00Z',
      ApprovedAt: null,
      CompletedAt: null
    }
  ]);

  // 11. Treatment Plan Items
  const [treatmentPlanItems, setTreatmentPlanItems] = useState([
    {
      PlanItemId: 1,
      TreatmentPlanId: 1,
      ToothRecordId: 14, // Tooth 14 record
      ProcedureId: 8, // D2330 Composite Filling
      Status: 'Planned',
      SessionNumber: 1,
      Priority: 1, // High
      EstimatedCost: 350.0,
      ActualCost: null,
      ScheduledDate: null,
      CompletedDate: null,
      AppointmentId: null,
      Notes: 'Occlusal surface filling.',
      CreatedAt: '2026-06-15T10:45:00Z'
    },
    {
      PlanItemId: 2,
      TreatmentPlanId: 1,
      ToothRecordId: 30, // Tooth 30 missing
      ProcedureId: 9, // D2740 Porcelain Crown
      Status: 'Planned',
      SessionNumber: 2,
      Priority: 2, // Medium
      EstimatedCost: 1800.0,
      ActualCost: null,
      ScheduledDate: null,
      CompletedDate: null,
      AppointmentId: null,
      Notes: 'Restorative crown after implant heals.',
      CreatedAt: '2026-06-15T10:45:00Z'
    }
  ]);

  // 12. Invoices
  const [invoices, setInvoices] = useState([
    {
      InvoiceId: 1,
      InvoiceNumber: 'INV-2026-00001',
      PatientId: 1,
      TreatmentPlanId: null,
      AppointmentId: 1,
      InvoiceDate: '2026-06-15',
      DueDate: '2026-06-30',
      SubTotal: 280.0, // evaluation D0120 ($80) + cleaning D1110 ($200)
      DiscountAmount: 30.0,
      TaxAmount: 0.0,
      TotalAmount: 250.0,
      PaidAmount: 150.0,
      BalanceDue: 100.0, // TotalAmount - PaidAmount
      Status: 'Partially Paid',
      PaymentTerms: 'Due on Receipt',
      Notes: 'Invoice for routine cleaning visit.',
      CreatedByUserId: 4,
      CreatedAt: '2026-06-15T11:00:00Z',
      UpdatedAt: '2026-06-15T11:30:00Z'
    },
    {
      InvoiceId: 2,
      InvoiceNumber: 'INV-2026-00002',
      PatientId: 2,
      TreatmentPlanId: null,
      AppointmentId: 2,
      InvoiceDate: '2026-06-15',
      DueDate: '2026-06-15',
      SubTotal: 120.0, // D0150 Comprehensive checkup
      DiscountAmount: 0.0,
      TaxAmount: 0.0,
      TotalAmount: 120.0,
      PaidAmount: 120.0,
      BalanceDue: 0.0,
      Status: 'Paid',
      PaymentTerms: 'Due on Receipt',
      Notes: 'Whitening consultation visit fee.',
      CreatedByUserId: 4,
      CreatedAt: '2026-06-15T15:30:00Z',
      UpdatedAt: '2026-06-15T15:45:00Z'
    }
  ]);

  // 13. Invoice Line Items
  const [invoiceLineItems, setInvoiceLineItems] = useState([
    { LineItemId: 1, InvoiceId: 1, ProcedureId: 1, ToothNumber: null, Description: 'Periodic oral evaluation (D0120)', Quantity: 1, UnitPrice: 80.0, DiscountPct: 0.0, LineTotal: 80.0 },
    { LineItemId: 2, InvoiceId: 1, ProcedureId: 5, ToothNumber: null, Description: 'Prophylaxis (cleaning) - adult (D1110)', Quantity: 1, UnitPrice: 200.0, DiscountPct: 15.0, LineTotal: 170.0 }, // discount 15% on 200 = 30
    { LineItemId: 3, InvoiceId: 2, ProcedureId: 2, ToothNumber: null, Description: 'Comprehensive oral evaluation (D0150)', Quantity: 1, UnitPrice: 120.0, DiscountPct: 0.0, LineTotal: 120.0 }
  ]);

  // 14. Payments
  const [payments, setPayments] = useState([
    {
      PaymentId: 1,
      InvoiceId: 1,
      PatientId: 1,
      PaymentDate: '2026-06-15',
      Amount: 150.0,
      PaymentMethod: 'Credit Card',
      ReferenceNumber: 'TXN-98439284',
      InsuranceProvider: null,
      InsuranceClaimNo: null,
      Notes: 'Copay payment from patient.',
      ReceivedByUserId: 4,
      CreatedAt: '2026-06-15T11:30:00Z',
      IsVoided: false,
      VoidedAt: null,
      VoidedByUserId: null,
      VoidReason: null
    },
    {
      PaymentId: 2,
      InvoiceId: 2,
      PatientId: 2,
      PaymentDate: '2026-06-15',
      Amount: 120.0,
      PaymentMethod: 'Cash',
      ReferenceNumber: 'REC-00129',
      InsuranceProvider: null,
      InsuranceClaimNo: null,
      Notes: 'Paid in full.',
      ReceivedByUserId: 4,
      CreatedAt: '2026-06-15T15:45:00Z',
      IsVoided: false,
      VoidedAt: null,
      VoidedByUserId: null,
      VoidReason: null
    }
  ]);

  // 15. Patient Ledger (Double Entry)
  const [patientLedger, setPatientLedger] = useState([
    // Patient 1
    { LedgerEntryId: 1, PatientId: 1, InvoiceId: 1, PaymentId: null, EntryDate: '2026-06-15', EntryType: 'Invoice', Debit: 250.0, Credit: 0.0, RunningBalance: 250.0, Description: 'Invoice INV-2026-00001 created', CreatedByUserId: 4, CreatedAt: '2026-06-15T11:00:00Z' },
    { LedgerEntryId: 2, PatientId: 1, InvoiceId: null, PaymentId: 1, EntryDate: '2026-06-15', EntryType: 'Payment', Debit: 0.0, Credit: 150.0, RunningBalance: 100.0, Description: 'Payment received — Credit Card', CreatedByUserId: 4, CreatedAt: '2026-06-15T11:30:00Z' },
    
    // Patient 2
    { LedgerEntryId: 3, PatientId: 2, InvoiceId: 2, PaymentId: null, EntryDate: '2026-06-15', EntryType: 'Invoice', Debit: 120.0, Credit: 0.0, RunningBalance: 120.0, Description: 'Invoice INV-2026-00002 created', CreatedByUserId: 4, CreatedAt: '2026-06-15T15:30:00Z' },
    { LedgerEntryId: 4, PatientId: 2, InvoiceId: null, PaymentId: 2, EntryDate: '2026-06-15', EntryType: 'Payment', Debit: 0.0, Credit: 120.0, RunningBalance: 0.0, Description: 'Payment received — Cash', CreatedByUserId: 4, CreatedAt: '2026-06-15T15:45:00Z' }
  ]);

  // 16 & 17. Prescriptions & PrescriptionItems
  const [prescriptions, setPrescriptions] = useState([
    {
      PrescriptionId: 1,
      PatientId: 1,
      DentistUserId: 2,
      AppointmentId: 1,
      PrescriptionDate: '2026-06-15',
      Diagnosis: 'Localized gingival swelling & sensitivity',
      Notes: 'Take medicine after meal. Follow up if swelling worsens.',
      IsPrinted: true,
      PrintedAt: '2026-06-15T10:45:00Z',
      CreatedAt: '2026-06-15T10:45:00Z'
    }
  ]);

  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      PrescriptionItemId: 1,
      PrescriptionId: 1,
      MedicineName: 'Amoxicillin 500mg',
      GenericName: 'Amoxicillin Trihydrate',
      Dosage: '1 tablet',
      Frequency: 'TDS (3 times/day)',
      Duration: '5 days',
      Route: 'Oral',
      Instructions: 'Finish full course. Take with food.',
      Quantity: 15
    },
    {
      PrescriptionItemId: 2,
      PrescriptionId: 1,
      MedicineName: 'Ibuprofen 400mg',
      GenericName: 'Ibuprofen',
      Dosage: '1 tablet',
      Frequency: 'PRN (As needed)',
      Duration: '3 days',
      Route: 'Oral',
      Instructions: 'Take for pain. Max 3 per day.',
      Quantity: 10
    }
  ]);

  // 18. Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { AuditId: 1, TableName: 'Patients', RecordId: 1, Action: 'INSERT', OldValues: null, NewValues: '{"FirstName":"John","LastName":"Doe"}', UserId: 4, ChangedAt: '2026-01-15T09:00:00Z', IPAddress: '192.168.1.45' }
  ]);

  // Helper function to log audit trail
  const addAuditLog = (tableName, recordId, action, oldValues, newValues) => {
    const newAudit = {
      AuditId: auditLogs.length + 1,
      TableName: tableName,
      RecordId: recordId,
      Action: action,
      OldValues: oldValues ? JSON.stringify(oldValues) : null,
      NewValues: newValues ? JSON.stringify(newValues) : null,
      UserId: currentUser ? currentUser.UserId : null,
      ChangedAt: new Date().toISOString(),
      IPAddress: '127.0.0.1'
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  // --- CRUD Engine & Actions matching Stored Procedures / Logic ---

  // 1. Patient Registration & Initial Dental Chart
  const registerPatient = (patientData) => {
    const nextPatientId = Math.max(...patients.map(p => p.PatientId), 0) + 1;
    const mrnSeq = String(nextPatientId).padStart(5, '0');
    const newMRN = `MRN-2026-${mrnSeq}`;

    const newPatient = {
      ...patientData,
      PatientId: nextPatientId,
      MRN: newMRN,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedByUserId: currentUser.UserId
    };

    setPatients(prev => [...prev, newPatient]);

    // Create Dental Chart (1:1)
    const nextChartId = Math.max(...dentalCharts.map(c => c.ChartId), 0) + 1;
    const newChart = {
      ChartId: nextChartId,
      PatientId: nextPatientId,
      Notes: 'Initial Dental Chart created upon registration.',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };
    setDentalCharts(prev => [...prev, newChart]);

    // Initialize 32 Tooth Records for this Chart
    const newTeeth = [];
    const maxToothRecId = Math.max(...toothRecords.map(tr => tr.ToothRecordId), 0);
    for (let t = 1; t <= 32; t++) {
      newTeeth.push({
        ToothRecordId: maxToothRecId + t,
        ChartId: nextChartId,
        ToothNumber: t,
        Surface: null,
        ToothStatus: 'Healthy',
        Notes: '',
        UpdatedByUserId: currentUser.UserId,
        RecordedAt: new Date().toISOString()
      });
    }
    setToothRecords(prev => [...prev, ...newTeeth]);
    addAuditLog('Patients', nextPatientId, 'INSERT', null, newPatient);
    return newPatient;
  };

  // 2. Charting: Update Tooth Record
  const updateToothRecord = (chartId, toothNumber, newStatus, newSurface, notes) => {
    let affectedRecord = null;
    let oldRecordCopy = null;

    setToothRecords(prev => {
      return prev.map(tr => {
        if (tr.ChartId === chartId && tr.ToothNumber === toothNumber) {
          affectedRecord = tr.ToothRecordId;
          oldRecordCopy = { ...tr };
          return {
            ...tr,
            ToothStatus: newStatus,
            Surface: newSurface || null,
            Notes: notes || '',
            UpdatedByUserId: currentUser.UserId,
            RecordedAt: new Date().toISOString()
          };
        }
        return tr;
      });
    });

    if (affectedRecord) {
      // Add Tooth History entry
      const nextHistId = Math.max(...toothHistory.map(h => h.HistoryId), 0) + 1;
      const historyEntry = {
        HistoryId: nextHistId,
        ToothRecordId: affectedRecord,
        PreviousStatus: oldRecordCopy.ToothStatus,
        NewStatus: newStatus,
        PreviousSurface: oldRecordCopy.Surface,
        NewSurface: newSurface || null,
        Notes: notes || '',
        ChangedByUserId: currentUser.UserId,
        ChangedAt: new Date().toISOString()
      };
      setToothHistory(prev => [historyEntry, ...prev]);
      addAuditLog('ToothRecords', affectedRecord, 'UPDATE', oldRecordCopy, { ToothStatus: newStatus, Surface: newSurface, Notes: notes });
    }
  };

  // 3. Appointments Scheduling
  const createAppointment = (apptData) => {
    const nextApptId = Math.max(...appointments.map(a => a.AppointmentId), 0) + 1;
    const newAppt = {
      ...apptData,
      AppointmentId: nextApptId,
      Status: 'Scheduled',
      ReminderSent: false,
      CreatedByUserId: currentUser.UserId,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };
    setAppointments(prev => [...prev, newAppt]);
    addAuditLog('Appointments', nextApptId, 'INSERT', null, newAppt);
    return newAppt;
  };

  const updateAppointmentStatus = (apptId, newStatus, clinicalNotes = null, cancelReason = null) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.AppointmentId === apptId) {
        const updated = {
          ...appt,
          Status: newStatus,
          UpdatedAt: new Date().toISOString()
        };
        if (clinicalNotes !== null) updated.ClinicalNotes = clinicalNotes;
        if (newStatus === 'Cancelled') {
          updated.CancelledAt = new Date().toISOString();
          updated.CancellationReason = cancelReason || 'No reason provided';
        }
        addAuditLog('Appointments', apptId, 'UPDATE', appt, updated);
        return updated;
      }
      return appt;
    }));
  };

  // 4. Treatment Planning
  const createTreatmentPlan = (patientId, planName, itemsList, planNotes = '') => {
    const nextPlanId = Math.max(...treatmentPlans.map(p => p.TreatmentPlanId), 0) + 1;
    const estimatedCost = itemsList.reduce((acc, it) => acc + Number(it.EstimatedCost), 0);
    
    const newPlan = {
      TreatmentPlanId: nextPlanId,
      PatientId,
      DentistUserId: currentUser.UserId,
      PlanName,
      Status: 'Draft',
      TotalEstimatedCost: estimatedCost,
      Notes: planNotes,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      ApprovedAt: null,
      CompletedAt: null
    };

    setTreatmentPlans(prev => [...prev, newPlan]);

    const baseItemId = Math.max(...treatmentPlanItems.map(it => it.PlanItemId), 0) + 1;
    const newItems = itemsList.map((it, idx) => ({
      PlanItemId: baseItemId + idx,
      TreatmentPlanId: nextPlanId,
      ToothRecordId: it.ToothRecordId || null,
      ProcedureId: it.ProcedureId,
      Status: 'Planned',
      SessionNumber: it.SessionNumber || 1,
      Priority: it.Priority || 2,
      EstimatedCost: Number(it.EstimatedCost),
      ActualCost: null,
      ScheduledDate: null,
      CompletedDate: null,
      AppointmentId: null,
      Notes: it.Notes || '',
      CreatedAt: new Date().toISOString()
    }));

    setTreatmentPlanItems(prev => [...prev, ...newItems]);
    addAuditLog('TreatmentPlans', nextPlanId, 'INSERT', null, newPlan);
    return newPlan;
  };

  const updateTreatmentPlanStatus = (planId, newStatus) => {
    setTreatmentPlans(prev => prev.map(p => {
      if (p.TreatmentPlanId === planId) {
        const updated = {
          ...p,
          Status: newStatus,
          UpdatedAt: new Date().toISOString()
        };
        if (newStatus === 'Approved') {
          updated.ApprovedAt = new Date().toISOString();
        } else if (newStatus === 'Completed') {
          updated.CompletedAt = new Date().toISOString();
        }
        addAuditLog('TreatmentPlans', planId, 'UPDATE', p, updated);
        return updated;
      }
      return p;
    }));
  };

  const updatePlanItemStatus = (itemId, newStatus, actualCost = null, completedDate = null) => {
    setTreatmentPlanItems(prev => prev.map(it => {
      if (it.PlanItemId === itemId) {
        const updated = { ...it, Status: newStatus };
        if (actualCost !== null) updated.ActualCost = Number(actualCost);
        if (completedDate !== null) updated.CompletedDate = completedDate;
        return updated;
      }
      return it;
    }));
  };

  // 5. Invoicing & Billing Ledger (corresponds to sp_CreateInvoice)
  const createInvoice = (patientId, treatmentPlanId, appointmentId, items) => {
    const nextInvoiceId = Math.max(...invoices.map(i => i.InvoiceId), 0) + 1;
    const invoiceNum = `INV-2026-${String(nextInvoiceId).padStart(5, '0')}`;
    
    // Calculate values
    const subTotal = items.reduce((acc, item) => acc + (item.UnitPrice * item.Quantity), 0);
    const discountAmount = items.reduce((acc, item) => acc + (item.UnitPrice * item.Quantity * (item.DiscountPct / 100)), 0);
    const taxAmount = 0.0;
    const totalAmount = subTotal - discountAmount + taxAmount;

    const newInvoice = {
      InvoiceId: nextInvoiceId,
      InvoiceNumber: invoiceNum,
      PatientId,
      TreatmentPlanId: treatmentPlanId || null,
      AppointmentId: appointmentId || null,
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days due
      SubTotal: subTotal,
      DiscountAmount: discountAmount,
      TaxAmount: taxAmount,
      TotalAmount: totalAmount,
      PaidAmount: 0.0,
      BalanceDue: totalAmount,
      Status: 'Sent',
      PaymentTerms: 'Net 15',
      Notes: 'Invoice generated.',
      CreatedByUserId: currentUser.UserId,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, newInvoice]);

    // Insert line items
    const baseLineId = Math.max(...invoiceLineItems.map(li => li.LineItemId), 0) + 1;
    const newLines = items.map((it, idx) => ({
      LineItemId: baseLineId + idx,
      InvoiceId: nextInvoiceId,
      ProcedureId: it.ProcedureId || null,
      ToothNumber: it.ToothNumber || null,
      Description: it.Description,
      Quantity: it.Quantity || 1,
      UnitPrice: Number(it.UnitPrice),
      DiscountPct: Number(it.DiscountPct || 0),
      LineTotal: it.Quantity * it.UnitPrice * (1 - (it.DiscountPct || 0) / 100)
    }));

    setInvoiceLineItems(prev => [...prev, ...newLines]);

    // Calculate ledger running balance for Patient
    const currentBalance = patientLedger
      .filter(l => l.PatientId === patientId)
      .reduce((sum, item) => sum + (Number(item.Debit) - Number(item.Credit)), 0);
    const newRunningBalance = currentBalance + totalAmount;

    // Add debit to ledger
    const nextLedgerId = Math.max(...patientLedger.map(l => l.LedgerEntryId), 0) + 1;
    const ledgerEntry = {
      LedgerEntryId: nextLedgerId,
      PatientId,
      InvoiceId: nextInvoiceId,
      PaymentId: null,
      EntryDate: new Date().toISOString().split('T')[0],
      EntryType: 'Invoice',
      Debit: totalAmount,
      Credit: 0.0,
      RunningBalance: newRunningBalance,
      Description: `Invoice ${invoiceNum} created`,
      CreatedByUserId: currentUser.UserId,
      CreatedAt: new Date().toISOString()
    };
    setPatientLedger(prev => [...prev, ledgerEntry]);
    addAuditLog('Invoices', nextInvoiceId, 'INSERT', null, newInvoice);
    return newInvoice;
  };

  // 6. Post Payment (corresponds to sp_PostPayment)
  const postPayment = (invoiceId, patientId, amount, paymentMethod, referenceNumber, notes = '') => {
    const amt = Number(amount);
    const nextPaymentId = Math.max(...payments.map(p => p.PaymentId), 0) + 1;
    
    // Create Payment Record
    const newPayment = {
      PaymentId: nextPaymentId,
      InvoiceId,
      PatientId,
      PaymentDate: new Date().toISOString().split('T')[0],
      Amount: amt,
      PaymentMethod,
      ReferenceNumber: referenceNumber || '',
      InsuranceProvider: paymentMethod === 'Insurance' ? 'MetLife Dental' : null,
      InsuranceClaimNo: paymentMethod === 'Insurance' ? referenceNumber : null,
      Notes,
      ReceivedByUserId: currentUser.UserId,
      CreatedAt: new Date().toISOString(),
      IsVoided: false,
      VoidedAt: null,
      VoidedByUserId: null,
      VoidReason: null
    };

    setPayments(prev => [...prev, newPayment]);

    // Update Invoice status and PaidAmount
    setInvoices(prev => prev.map(inv => {
      if (inv.InvoiceId === invoiceId) {
        const updatedPaid = inv.PaidAmount + amt;
        const balance = inv.TotalAmount - updatedPaid;
        const newStatus = balance <= 0 ? 'Paid' : 'Partially Paid';
        const updated = {
          ...inv,
          PaidAmount: updatedPaid,
          BalanceDue: balance,
          Status: newStatus,
          UpdatedAt: new Date().toISOString()
        };
        addAuditLog('Invoices', invoiceId, 'UPDATE', inv, updated);
        return updated;
      }
      return inv;
    }));

    // Calculate ledger running balance
    const currentBalance = patientLedger
      .filter(l => l.PatientId === patientId)
      .reduce((sum, item) => sum + (Number(item.Debit) - Number(item.Credit)), 0);
    const newRunningBalance = currentBalance - amt;

    // Add Credit ledger entry
    const nextLedgerId = Math.max(...patientLedger.map(l => l.LedgerEntryId), 0) + 1;
    const ledgerEntry = {
      LedgerEntryId: nextLedgerId,
      PatientId,
      InvoiceId: null,
      PaymentId: nextPaymentId,
      EntryDate: new Date().toISOString().split('T')[0],
      EntryType: 'Payment',
      Debit: 0.0,
      Credit: amt,
      RunningBalance: newRunningBalance,
      Description: `Payment received — ${paymentMethod}`,
      CreatedByUserId: currentUser.UserId,
      CreatedAt: new Date().toISOString()
    };
    setPatientLedger(prev => [...prev, ledgerEntry]);
    addAuditLog('Payments', nextPaymentId, 'INSERT', null, newPayment);
  };

  // 7. Write Prescriptions
  const createPrescription = (patientId, appointmentId, diagnosis, notes, rxItems) => {
    const nextRxId = Math.max(...prescriptions.map(p => p.PrescriptionId), 0) + 1;
    
    const newRx = {
      PrescriptionId: nextRxId,
      PatientId,
      DentistUserId: currentUser.UserId,
      AppointmentId: appointmentId || null,
      PrescriptionDate: new Date().toISOString().split('T')[0],
      Diagnosis,
      Notes,
      IsPrinted: false,
      PrintedAt: null,
      CreatedAt: new Date().toISOString()
    };

    setPrescriptions(prev => [...prev, newRx]);

    const baseItemId = Math.max(...prescriptionItems.map(pi => pi.PrescriptionItemId), 0) + 1;
    const newItems = rxItems.map((it, idx) => ({
      PrescriptionItemId: baseItemId + idx,
      PrescriptionId: nextRxId,
      MedicineName: it.MedicineName,
      GenericName: it.GenericName || '',
      Dosage: it.Dosage,
      Frequency: it.Frequency,
      Duration: it.Duration,
      Route: it.Route || 'Oral',
      Instructions: it.Instructions || '',
      Quantity: Number(it.Quantity || 1)
    }));

    setPrescriptionItems(prev => [...prev, ...newItems]);
    addAuditLog('Prescriptions', nextRxId, 'INSERT', null, newRx);
    return newRx;
  };

  const printPrescription = (rxId) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.PrescriptionId === rxId) {
        return {
          ...p,
          IsPrinted: true,
          PrintedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Settings & Procedures Catalog
  const updateProcedureCost = (procId, newCost) => {
    setProcedures(prev => prev.map(p => {
      if (p.ProcedureId === procId) {
        return { ...p, DefaultCost: Number(newCost) };
      }
      return p;
    }));
  };

  // Views Simulators (Derived selectors)
  const getPatientLedgerSummary = (patientId) => {
    const ledger = patientLedger.filter(l => l.PatientId === patientId);
    const totalCharged = ledger.reduce((sum, entry) => sum + Number(entry.Debit), 0);
    const totalPaid = ledger.reduce((sum, entry) => sum + Number(entry.Credit), 0);
    const outstanding = totalCharged - totalPaid;
    return {
      PatientId: patientId,
      TotalCharged: totalCharged,
      TotalPaid: totalPaid,
      OutstandingBalance: outstanding,
      CurrentBalance: ledger.length > 0 ? ledger[ledger.length - 1].RunningBalance : 0.0
    };
  };

  const getTodayAppointments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments
      .filter(appt => appt.AppointmentDate.startsWith(todayStr))
      .map(appt => {
        const patient = patients.find(p => p.PatientId === appt.PatientId);
        const dentist = users.find(u => u.UserId === appt.DentistUserId);
        return {
          AppointmentId: appt.AppointmentId,
          AppointmentDate: appt.AppointmentDate,
          DurationMinutes: appt.DurationMinutes,
          Status: appt.Status,
          AppointmentType: appt.AppointmentType,
          PatientId: appt.PatientId,
          MRN: patient ? patient.MRN : '',
          PatientName: patient ? `${patient.FirstName} ${patient.LastName}` : 'Unknown',
          PatientPhone: patient ? patient.Phone : '',
          DentistName: dentist ? `Dr. ${dentist.FirstName} ${dentist.LastName}` : 'Unknown',
          ChiefComplaint: appt.ChiefComplaint
        };
      });
  };

  const getOverdueInvoices = () => {
    const today = new Date();
    return invoices
      .filter(inv => {
        const due = new Date(inv.DueDate);
        return inv.Status !== 'Paid' && inv.Status !== 'Cancelled' && due < today && inv.BalanceDue > 0;
      })
      .map(inv => {
        const patient = patients.find(p => p.PatientId === inv.PatientId);
        const due = new Date(inv.DueDate);
        const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
        return {
          InvoiceId: inv.InvoiceId,
          InvoiceNumber: inv.InvoiceNumber,
          PatientId: inv.PatientId,
          PatientName: patient ? `${patient.FirstName} ${patient.LastName}` : 'Unknown',
          Phone: patient ? patient.Phone : '',
          InvoiceDate: inv.InvoiceDate,
          DueDate: inv.DueDate,
          TotalAmount: inv.TotalAmount,
          PaidAmount: inv.PaidAmount,
          BalanceDue: inv.BalanceDue,
          DaysOverdue: diffDays
        };
      });
  };

  return (
    <DatabaseContext.Provider value={{
      roles,
      users,
      currentUser,
      setCurrentUser,
      patients,
      dentalCharts,
      toothRecords,
      toothHistory,
      procedureCategories,
      procedures,
      appointments,
      treatmentPlans,
      treatmentPlanItems,
      invoices,
      invoiceLineItems,
      payments,
      patientLedger,
      prescriptions,
      prescriptionItems,
      auditLogs,
      
      // Operations
      registerPatient,
      updateToothRecord,
      createAppointment,
      updateAppointmentStatus,
      createTreatmentPlan,
      updateTreatmentPlanStatus,
      updatePlanItemStatus,
      createInvoice,
      postPayment,
      createPrescription,
      printPrescription,
      updateProcedureCost,
      
      // Derived Views
      getPatientLedgerSummary,
      getTodayAppointments,
      getOverdueInvoices
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
