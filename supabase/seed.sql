-- DentSuite · seed data (development)
-- Mirrors src/utils/mockData.js so the app looks familiar on first run.
-- NOTE: invoices are seeded with paid_amount 0 — the payment INSERTs below
-- drive the billing trigger, proving the state machine works on day one.

-- Locations
insert into locations (id, name, address, phone, email, manager, chairs, open_hours, status, color, is_primary) values
  ('10000000-0000-0000-0000-000000000001', 'Main Clinic — Gulshan', 'Plot 45-C, Block 5, Gulshan-e-Iqbal, Karachi', '+92 21 3482 0011', 'gulshan@dentsuite.com', 'Dr. Hamza Zahid', 4, 'Mon–Sat · 9 AM – 8 PM', 'Active', '#0F4C81', true),
  ('10000000-0000-0000-0000-000000000002', 'DHA Branch', '12th Commercial Street, DHA Phase 6, Karachi', '+92 21 3584 7722', 'dha@dentsuite.com', 'Dr. Sarah Ahmed', 2, 'Mon–Fri · 10 AM – 7 PM', 'Active', '#0D9488', false);

-- Staff (dentists + support)
insert into staff (id, name, role, specialty, email, phone, status, joined_date, location_id) values
  ('20000000-0000-0000-0000-000000000001', 'Dr. Hamza Zahid', 'Dentist', 'Chief Clinical Director & Surgeon', 'hamza@dentsuite.com', '+92 300 1112233', 'Active', '2021-03-01', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Dr. Sarah Ahmed', 'Dentist', 'Orthodontist & Pedodontist', 'sarah@dentsuite.com', '+92 301 2223344', 'Active', '2022-07-15', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Dr. Ayesha Khan', 'Dentist', 'Endodontist', 'ayesha@dentsuite.com', '+92 302 3334455', 'Active', '2023-01-10', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000004', 'Bilal Hussain', 'Receptionist', null, 'bilal@dentsuite.com', '+92 303 4445566', 'Active', '2022-09-01', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'Nadia Aslam', 'Dental Hygienist', 'Preventive Care', 'nadia@dentsuite.com', '+92 304 5556677', 'Active', '2023-05-20', '10000000-0000-0000-0000-000000000001');

-- Patients
insert into patients (id, name, gender, dob, phone, email, address, allergies, status, registration_date, blood_group) values
  ('30000000-0000-0000-0000-000000000001', 'Muhammad Ali', 'Male', '1988-04-12', '+92 300 1234567', 'm.ali@email.com', 'Gulshan-e-Iqbal, Karachi', 'Penicillin, Latex', 'Pending Payment', '2024-01-15', 'O+'),
  ('30000000-0000-0000-0000-000000000002', 'Ayesha Siddiqua', 'Female', '1995-09-24', '+92 321 9876543', 'ayesha.s@email.com', 'F-7/2, Islamabad', 'None', 'Active', '2024-02-10', 'A-'),
  ('30000000-0000-0000-0000-000000000003', 'Zainab Fatima', 'Female', '2001-11-05', '+92 333 4567890', 'zainab.f@email.com', 'DHA Phase 6, Lahore', 'Sulfa Drugs', 'Active', '2024-03-01', 'B+'),
  ('30000000-0000-0000-0000-000000000004', 'Omar Farooq', 'Male', '1975-07-19', '+92 312 8887776', 'omar.farooq@email.com', 'Model Town, Lahore', 'Aspirin', 'Active', '2023-05-20', 'AB+'),
  ('30000000-0000-0000-0000-000000000005', 'Bilal Khan', 'Male', '1992-12-30', '+92 304 5556667', 'bilal.k@email.com', 'G-9, Islamabad', 'None', 'Active', '2024-04-18', 'O-');

-- Appointments (relative to today)
insert into appointments (patient_id, dentist_id, location_id, date, time, type, status, notes) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', current_date, '09:30 AM', 'Root Canal', 'Arrived', 'Obturation of distal root canal.'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', current_date, '11:00 AM', 'Crown', 'In Progress', 'Crown placement #16.'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', current_date, '01:30 PM', 'Scaling', 'Scheduled', 'Routine cleaning.'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', current_date - 3, '10:00 AM', 'Extraction', 'Completed', 'Extraction of #41.'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', current_date - 10, '02:00 PM', 'Scaling', 'No Show', 'Missed appointment.'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', current_date + 2, '11:30 AM', 'Filling', 'Scheduled', 'Composite restoration.');

-- Treatments
insert into treatments (patient_id, dentist_id, date, type, tooth_number, cost, notes) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date - 15, 'Root Canal', '36', 12000, 'First stage pulpectomy.'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', current_date - 3, 'Extraction', '41', 3500, 'Surgical extraction.'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', current_date, 'Filling', '24', 5000, 'Class II composite.');

-- Invoices — paid_amount 0; payments below exercise the trigger.
insert into invoices (id, patient_id, invoice_number, date, due_date, total_amount) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'INV-2026-001', current_date - 15, current_date - 5, 12000),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'INV-2026-002', current_date - 3, current_date + 7, 3500),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 'INV-2026-003', current_date, current_date + 10, 5000);

-- Payments — after these run: INV-001 = Partially Paid (6000/12000),
-- INV-002 = Paid, INV-003 = Unpaid. Verify in the invoices table!
insert into payments (invoice_id, patient_id, date, amount, method) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', current_date - 15, 6000, 'Cash'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', current_date - 3, 3500, 'Credit Card');

-- Clinical extras
insert into prescriptions (patient_id, dentist_id, medication, dosage, frequency, duration, date, status) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Amoxicillin', '500mg', 'Twice daily', '7 days', current_date - 10, 'active');

insert into lab_cases (patient_id, dentist_id, lab_name, case_type, tooth_number, status, cost, sent_date, due_date, notes) values
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Apex Dental Lab', 'Bridge', '45', 'Sent', 18000, current_date - 10, current_date - 2, 'Chase the lab.');

insert into recalls (patient_id, type, due_date, status, channel, notes) values
  ('30000000-0000-0000-0000-000000000004', 'Cleaning / Scaling', current_date - 3, 'Reminded', 'WhatsApp', 'Overdue recall'),
  ('30000000-0000-0000-0000-000000000001', '6-Month Checkup', current_date + 5, 'Pending', 'WhatsApp', null);

insert into claims (patient_id, payer, policy_number, service_date, submitted_date, procedures, claimed_amount, approved_amount, status) values
  ('30000000-0000-0000-0000-000000000001', 'State Life Insurance', 'SL-100923', current_date - 3, current_date - 2, 'Consultation + X-ray', 3500, 0, 'Submitted');

insert into membership_plans (id, name, price, cycle, discount, benefits, color) values
  ('50000000-0000-0000-0000-000000000001', 'Basic Care', 6000, 'Annual', 10, '2 cleanings, 1 exam, 1 X-ray per year', '#0D9488'),
  ('50000000-0000-0000-0000-000000000002', 'Premium Care', 12000, 'Annual', 20, '3 cleanings, 2 exams, X-rays & whitening', '#0F4C81');

insert into memberships (patient_id, plan_id, start_date, renewal_date, status, price) values
  ('30000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', current_date - 350, current_date + 15, 'Active', 6000);

insert into conversations (id, patient_id, channel, unread) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'WhatsApp', true);

insert into messages (conversation_id, sender, body, at) values
  ('60000000-0000-0000-0000-000000000001', 'clinic', 'Salaam Muhammad, a reminder of your root canal follow-up tomorrow at 9:30 AM.', now() - interval '1 day'),
  ('60000000-0000-0000-0000-000000000001', 'patient', 'Thank you, I will be there inshAllah.', now() - interval '20 hours');

insert into campaigns (name, segment, subject, body, status, recipients, created_date, sent_at) values
  ('Whitening Month Offer', 'All Patients', '20% off teeth whitening this month', 'Book a whitening session this month and save 20%.', 'Sent', 5, current_date - 20, current_date - 18);

insert into referrals (direction, patient_id, patient_name, provider, practice, specialty, reason, date, status) values
  ('Outbound', '30000000-0000-0000-0000-000000000003', 'Zainab Fatima', 'Dr. Kamran Qureshi', 'Karachi Maxillofacial Centre', 'Oral & Maxillofacial Surgery', 'Impacted #38 — surgical extraction.', current_date - 7, 'Scheduled');

insert into imaging_records (patient_id, type, tooth_number, date, taken_by, notes) values
  ('30000000-0000-0000-0000-000000000001', 'Periapical X-Ray', '36', current_date - 15, 'Dr. Hamza Zahid', 'Pre-RCT radiograph.');

insert into inventory (name, category, supplier, current_stock, reorder_level, unit_price, status) values
  ('Composite Resin A2', 'Restorative Materials', 'Dental Supplies Plus', 45, 20, 1200, 'In Stock'),
  ('Surgical Gloves (Box)', 'Protective Equipment', 'MediCare Supply', 8, 30, 450, 'Low Stock');

insert into expenses (date, category, vendor, description, amount, method, status) values
  (current_date - 2, 'Supplies', 'Dental Supplies Plus', 'Composite & consumables restock', 42000, 'Bank Transfer', 'Paid'),
  (current_date - 1, 'Utilities', 'K-Electric', 'Monthly electricity bill', 18500, 'Cash', 'Pending');

insert into form_submissions (patient_id, template_id, template_name, category, status, sent_date) values
  ('30000000-0000-0000-0000-000000000003', 'ft-1', 'New Patient Intake', 'Intake', 'Pending', current_date - 1);

insert into audit_log (user_name, module, action, detail) values
  ('System', 'Setup', 'Database seeded', 'Development seed data loaded');
