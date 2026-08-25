import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClinicContext } from './ClinicContextCore';
import {
  mockPatients,
  mockAppointments,
  mockTreatments,
  mockInvoices,
  mockPayments,
  mockTreatmentPlans,
  mockStaff,
  mockLabCases,
  mockRecalls,
  mockDocuments,
  mockExpenses,
  mockClaims,
  mockBookingRequests,
  mockMembershipPlans,
  mockMemberships,
  mockFormSubmissions,
  mockPerioCharts,
  mockAuditLog,
  mockLocations,
  mockCampaigns,
  mockImagingRecords,
  mockReferrals,
  mockConversations
} from '../utils/mockData';
import { recalcInvoice } from '../utils/billing';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { patientService } from '../services/patientService';
import { staffService } from '../services/staffService';
import { appointmentService } from '../services/appointmentService';
import { treatmentService } from '../services/treatmentService';
import { billingService } from '../services/billingService';
import { entityServices as es } from '../services/entityServices';
import { storageService } from '../services/storageService';

// Bump this version to reset every browser's saved demo data to a clean slate
// (old data under a previous key is simply ignored).
const STORAGE_KEY = 'dental-clinic-app-data-v2';

// Cap the charting audit log so the persisted blob can't grow without bound
// (localStorage is ~5MB and the whole app state is serialised on every change).
const MAX_HISTORY = 1000;

// Collision-safe id generator. Date.now() alone duplicates when two records are
// created in the same millisecond; the monotonic counter guarantees uniqueness
// within a session, which is what React keys and entity links rely on.
let idSeq = 0;
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

const today = () => new Date().toISOString().split('T')[0];

// Local YYYY-MM-DD (avoids the UTC day-shift of toISOString).
const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addCycle = (cycle, from = new Date()) => {
  const d = new Date(from);
  if (cycle === 'Monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return dateStr(d);
};

const readStored = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const ClinicProvider = ({ children }) => {
  const stored = useMemo(() => readStored(), []);
  const { isAuthenticated, user: authUser } = useAuth();

  // LIVE mode: the clinical core (patients, staff, appointments, treatments,
  // invoices, payments) is served by Supabase - states start empty and fill
  // from the database after sign-in. DEMO mode keeps localStorage + mocks.
  const live = isSupabaseConfigured && isAuthenticated;
  const [coreLoading, setCoreLoading] = useState(isSupabaseConfigured);

  const [patients, setPatients] = useState(() => (isSupabaseConfigured ? [] : stored.patients || mockPatients));
  const [appointments, setAppointments] = useState(() => (isSupabaseConfigured ? [] : stored.appointments || mockAppointments));
  const [treatments, setTreatments] = useState(() => (isSupabaseConfigured ? [] : stored.treatments || mockTreatments));
  // Normalise every invoice through the billing state machine on load so
  // balanceDue / status / paymentPercentage are always derived from the
  // amounts - this self-heals any inconsistent persisted or seed data.
  // (Live mode skips this: the database trigger is the source of truth.)
  const [invoices, setInvoices] = useState(() =>
    isSupabaseConfigured ? [] : (stored.invoices || mockInvoices).map((inv) => recalcInvoice(inv))
  );
  const [payments, setPayments] = useState(() => (isSupabaseConfigured ? [] : stored.payments || mockPayments));

  // Staff / team is the master list; dentists are derived from it so every
  // dentist dropdown (appointments, treatments, prescriptions, plans) reflects
  // the staff roster - single source of truth, no duplicated dentist data.
  const [staff, setStaff] = useState(() => (isSupabaseConfigured ? [] : stored.staff || mockStaff));
  const dentists = useMemo(() => staff.filter((s) => s.role === 'Dentist'), [staff]);

  // (reloadLive + the initial-load/realtime effect are defined below, after
  // every entity state they refetch has been declared.)

  // Dental charting (odontogram) state.
  // toothRecords: { [patientId]: { [toothNumber]: { status, surfaces, notes, updatedAt } } }
  // toothHistory: append-only audit log of every charting change (capped).
  const [toothRecords, setToothRecords] = useState(() => (isSupabaseConfigured ? {} : stored.toothRecords || {}));
  const [toothHistory, setToothHistory] = useState(() => (isSupabaseConfigured ? [] : stored.toothHistory || []));

  // Prescriptions (persisted, with an active ↔ completed lifecycle).
  const [prescriptions, setPrescriptions] = useState(() => (isSupabaseConfigured ? [] : stored.prescriptions || []));

  // Treatment plans (multi-visit, phased; persisted).
  const [treatmentPlans, setTreatmentPlans] = useState(() => (isSupabaseConfigured ? [] : stored.treatmentPlans || mockTreatmentPlans));

  // External lab cases (Sent → In Progress → Received → Fitted; persisted).
  const [labCases, setLabCases] = useState(() => (isSupabaseConfigured ? [] : stored.labCases || mockLabCases));

  // Patient recalls / reminders (email-only; persisted).
  const [recalls, setRecalls] = useState(() => (isSupabaseConfigured ? [] : stored.recalls || mockRecalls));

  // Patient documents (metadata only - no file bytes; persisted).
  const [documents, setDocuments] = useState(() => (isSupabaseConfigured ? [] : stored.documents || mockDocuments));

  // Clinic expenses (spending side of the ledger; persisted).
  const [expenses, setExpenses] = useState(() => (isSupabaseConfigured ? [] : stored.expenses || mockExpenses));

  // Insurance claims (Draft → Submitted → In Review → Approved/Denied → Paid; persisted).
  const [claims, setClaims] = useState(() => (isSupabaseConfigured ? [] : stored.claims || mockClaims));

  // Online booking requests (Pending → Confirmed/Declined; persisted).
  const [bookingRequests, setBookingRequests] = useState(() => (isSupabaseConfigured ? [] : stored.bookingRequests || mockBookingRequests));

  // Membership plans + patient enrollments (in-house plans; persisted).
  const [membershipPlans, setMembershipPlans] = useState(() => (isSupabaseConfigured ? [] : stored.membershipPlans || mockMembershipPlans));
  const [memberships, setMemberships] = useState(() => (isSupabaseConfigured ? [] : stored.memberships || mockMemberships));

  // Digital form submissions (Pending → Completed/e-signed; persisted).
  const [formSubmissions, setFormSubmissions] = useState(() => (isSupabaseConfigured ? [] : stored.formSubmissions || mockFormSubmissions));

  // Periodontal charts: { [patientId]: { [toothNumber]: { depths:[6], bop } } } (persisted).
  const [perioCharts, setPerioCharts] = useState(() => (isSupabaseConfigured ? {} : stored.perioCharts || mockPerioCharts));

  // Audit log - append-only activity trail, capped (persisted).
  const [auditLog, setAuditLog] = useState(() => (isSupabaseConfigured ? [] : stored.auditLog || mockAuditLog));

  // Clinic locations (multi-branch). Staff carry an optional locationId; a
  // missing locationId means the primary location (see primaryLocationId).
  const [locations, setLocations] = useState(() => (isSupabaseConfigured ? [] : stored.locations || mockLocations));

  // Marketing campaigns (email-only; Draft → Sent; persisted).
  const [campaigns, setCampaigns] = useState(() => (isSupabaseConfigured ? [] : stored.campaigns || mockCampaigns));

  // Imaging records (metadata only - no image bytes; persisted).
  const [imagingRecords, setImagingRecords] = useState(() => (isSupabaseConfigured ? [] : stored.imagingRecords || mockImagingRecords));

  // Referrals (Inbound/Outbound; Pending → Contacted → Scheduled → Completed; persisted).
  const [referrals, setReferrals] = useState(() => (isSupabaseConfigured ? [] : stored.referrals || mockReferrals));

  // Two-way patient messaging (WhatsApp/SMS; sends simulated until gateway; persisted).
  const [conversations, setConversations] = useState(() => (isSupabaseConfigured ? [] : stored.conversations || mockConversations));

  // Refetch any subset of the live collections (all of them by default).
  const reloadLive = useCallback(async (...keys) => {
    const jobs = {
      patients: async () => setPatients(await patientService.list()),
      staff: async () => setStaff(await staffService.list()),
      appointments: async () => setAppointments(await appointmentService.list()),
      treatments: async () => setTreatments(await treatmentService.list()),
      invoices: async () => setInvoices(await billingService.listInvoices()),
      payments: async () => setPayments(await billingService.listPayments()),
      prescriptions: async () => setPrescriptions(await es.prescriptions.list()),
      treatmentPlans: async () => setTreatmentPlans(await es.treatmentPlans.list()),
      labCases: async () => setLabCases(await es.labCases.list()),
      recalls: async () => setRecalls(await es.recalls.list()),
      documents: async () => setDocuments(await es.documents.list()),
      expenses: async () => setExpenses(await es.expenses.list()),
      claims: async () => setClaims(await es.claims.list()),
      bookings: async () => setBookingRequests(await es.bookings.list()),
      membershipPlans: async () => setMembershipPlans(await es.memberships.listPlans()),
      memberships: async () => setMemberships(await es.memberships.list()),
      forms: async () => setFormSubmissions(await es.forms.list()),
      campaigns: async () => setCampaigns(await es.campaigns.list()),
      referrals: async () => setReferrals(await es.referrals.list()),
      imaging: async () => setImagingRecords(await es.imaging.list()),
      locations: async () => setLocations(await es.locations.list()),
      conversations: async () => setConversations(await es.conversations.list()),
      toothRecords: async () => setToothRecords(await es.charting.listToothRecords()),
      toothHistory: async () => setToothHistory(await es.charting.listToothHistory()),
      perio: async () => setPerioCharts(await es.charting.listPerio()),
      audit: async () => setAuditLog(await es.audit.list()),
    };
    const list = keys.length ? keys : Object.keys(jobs);
    await Promise.all(list.map((k) => jobs[k]().catch((e) => console.error(`[live] reload ${k}:`, e.message))));
  }, []);

  // Initial load after sign-in + realtime sync: any change to a table (this
  // device or another) refetches the matching collection.
  useEffect(() => {
    if (!live) return undefined;
    reloadLive().then(() => setCoreLoading(false));
    const TABLE_JOBS = {
      patients: 'patients', staff: 'staff', appointments: 'appointments',
      treatments: 'treatments', invoices: 'invoices', payments: 'payments',
      prescriptions: 'prescriptions', treatment_plans: 'treatmentPlans', plan_items: 'treatmentPlans',
      lab_cases: 'labCases', recalls: 'recalls', documents: 'documents',
      expenses: 'expenses', claims: 'claims', booking_requests: 'bookings',
      membership_plans: 'membershipPlans', memberships: 'memberships',
      form_submissions: 'forms', campaigns: 'campaigns', referrals: 'referrals',
      imaging_records: 'imaging', locations: 'locations',
      conversations: 'conversations', messages: 'conversations',
      tooth_records: 'toothRecords', tooth_history: 'toothHistory',
      perio_entries: 'perio', audit_log: 'audit',
    };
    let channel = supabase.channel('clinic-sync');
    Object.entries(TABLE_JOBS).forEach(([table, job]) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => reloadLive(job));
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [live, reloadLive]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          patients,
          appointments,
          treatments,
          invoices,
          payments,
          toothRecords,
          toothHistory,
          prescriptions,
          treatmentPlans,
          staff,
          labCases,
          recalls,
          documents,
          expenses,
          claims,
          bookingRequests,
          membershipPlans,
          memberships,
          formSubmissions,
          perioCharts,
          auditLog,
          locations,
          campaigns,
          imagingRecords,
          referrals,
          conversations,
        })
      );
    } catch {
      // Storage full or unavailable (e.g. private mode). The app keeps working
      // from in-memory state; we just can't persist this change.
    }
  }, [patients, appointments, treatments, invoices, payments, toothRecords, toothHistory, prescriptions, treatmentPlans, staff, labCases, recalls, documents, expenses, claims, bookingRequests, membershipPlans, memberships, formSubmissions, perioCharts, auditLog, locations, campaigns, imagingRecords, referrals, conversations]);

  // Append an audit entry - locally for instant UI, and to the append-only
  // audit_log table in live mode (server timestamps, no update/delete policy).
  const logAudit = useCallback((module, action, detail) => {
    const entry = { id: uid('aud'), at: new Date().toISOString(), user: authUser?.name || 'Staff', module, action, detail };
    setAuditLog((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    if (live) {
      es.audit.add(entry).catch((e) => console.error('[live] audit:', e.message));
    }
  }, [live, authUser?.name]);

  const addPatient = useCallback(async (patientData) => {
    if (live) {
      const created = await patientService.create(patientData);
      setPatients((prev) => [created, ...prev]);
      logAudit('Patients', 'Patient registered', created.name);
      return created;
    }
    const newPatient = {
      ...patientData,
      id: uid('pat'),
      registrationDate: today(),
      status: patientData.status || 'Active',
    };
    setPatients((prev) => [newPatient, ...prev]);
    logAudit('Patients', 'Patient registered', newPatient.name);
    return newPatient;
  }, [live, logAudit]);

  const updatePatient = useCallback((patientId, updates) => {
    // Optimistic local update either way; live mode persists behind it.
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
    );
    if (live) {
      patientService.update(patientId, updates).catch((e) => {
        console.error('[live] updatePatient:', e.message);
        reloadLive('patients');
      });
    }
  }, [live, reloadLive]);

  // Deleting a patient cascades to all their records (the DB enforces this via
  // ON DELETE CASCADE). We mirror the visible cascade locally so no orphaned
  // rows linger on screen, then persist.
  const deletePatient = useCallback((patientId) => {
    const target = patients.find((p) => p.id === patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    setAppointments((prev) => prev.filter((a) => a.patientId !== patientId));
    setInvoices((prev) => prev.filter((i) => i.patientId !== patientId));
    setPayments((prev) => prev.filter((pm) => pm.patientId !== patientId));
    if (live) {
      patientService.remove(patientId).catch((e) => {
        console.error('[live] deletePatient:', e.message);
        reloadLive('patients', 'appointments', 'invoices', 'payments');
      });
    }
    if (target) logAudit('Patients', 'Patient deleted', target.name);
  }, [live, patients, reloadLive, logAudit]);

  const addAppointment = useCallback(async (apptData) => {
    if (live) {
      const created = await appointmentService.create(apptData);
      setAppointments((prev) => [created, ...prev]);
      logAudit('Appointments', 'Appointment scheduled', `${created.patientName} - ${created.type} with ${created.dentistName} on ${created.date}`);
      return created;
    }
    const patientObj = patients.find((p) => p.id === apptData.patientId);
    const dentistObj = dentists.find((d) => d.id === apptData.dentistId);
    const newAppt = {
      ...apptData,
      id: uid('appt'),
      patientName: patientObj?.name || 'Unknown Patient',
      dentistName: dentistObj?.name || 'Unknown Dentist',
      status: apptData.status || 'Scheduled',
    };
    setAppointments((prev) => [newAppt, ...prev]);
    logAudit('Appointments', 'Appointment scheduled', `${newAppt.patientName} - ${newAppt.type} with ${newAppt.dentistName} on ${newAppt.date}`);
    return newAppt;
  }, [live, patients, dentists, logAudit]);

  const updateAppointmentStatus = useCallback((apptId, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a))
    );
    if (live) {
      appointmentService.updateStatus(apptId, status).catch((e) => {
        console.error('[live] updateAppointmentStatus:', e.message);
        reloadLive('appointments');
      });
    }
  }, [live, reloadLive]);

  const assignDentist = useCallback((apptId, dentistId) => {
    const dentistObj = dentists.find((d) => d.id === dentistId);
    if (!dentistObj) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apptId ? { ...a, dentistId, dentistName: dentistObj.name } : a
      )
    );
    if (live) {
      appointmentService.assignDentist(apptId, dentistId).catch((e) => {
        console.error('[live] assignDentist:', e.message);
        reloadLive('appointments');
      });
    }
  }, [live, dentists, reloadLive]);

  const addTreatment = useCallback((treatmentData) => {
    if (live) {
      // Fire-and-forget for callers; the database is the source of truth and
      // the refetch below brings every derived record (invoice, patient
      // status) back in one consistent snapshot.
      return (async () => {
        try {
          const created = await treatmentService.create(treatmentData);
          await billingService.createInvoice({
            patientId: treatmentData.patientId,
            totalAmount: Number(treatmentData.cost),
            dueDays: 10,
          });
          const pat = patients.find((p) => p.id === treatmentData.patientId);
          if (pat && pat.status !== 'Pending Payment') {
            await patientService.update(pat.id, { status: 'Pending Payment' });
          }
          await reloadLive('treatments', 'invoices', 'patients');
          logAudit('Treatments', 'Treatment logged', `${created.patientName} - ${created.type} (tooth ${created.toothNumber}), invoice generated`);
          return created;
        } catch (e) {
          console.error('[live] addTreatment:', e.message);
          return null;
        }
      })();
    }
    const patientObj = patients.find((p) => p.id === treatmentData.patientId);
    const now = new Date();
    const newTreatment = {
      ...treatmentData,
      id: uid('treat'),
      patientName: patientObj?.name || 'Unknown Patient',
      date: today(),
      cost: Number(treatmentData.cost),
    };
    setTreatments((prev) => [newTreatment, ...prev]);

    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 10);

    // Run through the billing state machine so balanceDue / status /
    // paymentPercentage are always consistent - never hand-set.
    const newInvoice = recalcInvoice({
      id: uid('inv'),
      patientId: treatmentData.patientId,
      patientName: patientObj?.name || 'Unknown Patient',
      invoiceNumber: `INV-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
      date: today(),
      dueDate: dueDate.toISOString().split('T')[0],
      totalAmount: Number(treatmentData.cost),
      paidAmount: 0,
    });
    setInvoices((prev) => [newInvoice, ...prev]);

    setPatients((prev) =>
      prev.map((p) =>
        p.id === treatmentData.patientId && p.status !== 'Pending Payment'
          ? { ...p, status: 'Pending Payment' }
          : p
      )
    );

    logAudit('Treatments', 'Treatment logged', `${newTreatment.patientName} - ${newTreatment.type} (tooth ${newTreatment.toothNumber}), invoice ${newInvoice.invoiceNumber} generated`);
    return newTreatment;
  }, [live, patients, reloadLive, logAudit]);

  const addPayment = useCallback((paymentData) => {
    if (live) {
      // The Postgres trigger recalculates the invoice (and refuses
      // overpayment); we insert, then refetch the consistent result.
      return (async () => {
        try {
          const payment = await billingService.addPayment(paymentData);
          const inv = await billingService.getInvoice(paymentData.invoiceId);
          if (inv.balanceDue <= 0) {
            const pat = patients.find((p) => p.id === inv.patientId);
            if (pat?.status === 'Pending Payment') {
              await patientService.update(inv.patientId, { status: 'Active' });
            }
          }
          await reloadLive('invoices', 'payments', 'patients');
          logAudit('Billing', 'Payment recorded', `Rs ${Number(paymentData.amount).toLocaleString()} from ${inv.patientName} (${paymentData.method || 'Cash'})`);
          return payment;
        } catch (e) {
          console.error('[live] addPayment:', e.message);
          await reloadLive('invoices', 'payments');
          return null;
        }
      })();
    }
    // Resolve the target invoice up front so payment metadata and the
    // patient-status decision are based on real values - not on flags mutated
    // inside a setState updater (those run during commit, after this function
    // returns, so reading them synchronously was unreliable).
    const targetInvoice = invoices.find((inv) => inv.id === paymentData.invoiceId);
    const amount = Number(paymentData.amount) || 0;

    const newPayment = {
      ...paymentData,
      id: uid('pay'),
      // Data-integrity links: a payment is tied to its invoice AND patient.
      patientId: paymentData.patientId || targetInvoice?.patientId || '',
      patientName: paymentData.patientName || targetInvoice?.patientName || '',
      date: today(),
      amount,
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Recalculate the invoice through the billing state machine. Using a
    // functional update keeps us correct even if multiple payments land in the
    // same render, and recalcInvoice clamps overpayment and derives status.
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === paymentData.invoiceId
          ? recalcInvoice(inv, (Number(inv.paidAmount) || 0) + amount)
          : inv
      )
    );

    // If this payment clears the balance, reactivate a "Pending Payment"
    // patient. Decided from the resolved invoice, not a side-effect flag.
    if (targetInvoice) {
      const projectedPaid = (Number(targetInvoice.paidAmount) || 0) + amount;
      const nowFullyPaid = projectedPaid >= (Number(targetInvoice.totalAmount) || 0);
      if (nowFullyPaid) {
        setPatients((prevPatients) =>
          prevPatients.map((p) =>
            p.id === targetInvoice.patientId && p.status === 'Pending Payment'
              ? { ...p, status: 'Active' }
              : p
          )
        );
      }
    }

    logAudit('Billing', 'Payment recorded', `Rs ${amount.toLocaleString()} from ${newPayment.patientName} (${newPayment.method || 'Cash'})`);
    return newPayment;
  }, [live, patients, invoices, reloadLive, logAudit]);

  // Chart a single tooth. Records the change and appends an audit entry.
  // surfaces is a compact string of surface letters (e.g. "MOD"); the caller
  // is responsible for only passing surfaces for surface-based statuses.
  const updateTooth = useCallback((patientId, toothNumber, { status, surfaces = '', notes = '' }) => {
    const num = Number(toothNumber);
    const record = {
      status,
      surfaces: surfaces || '',
      notes: notes || '',
      updatedAt: new Date().toISOString(),
    };

    if (live) {
      const prevStatus = toothRecords[patientId]?.[num]?.status || 'Healthy';
      es.charting.upsertTooth(patientId, num, record).catch((e) => console.error('[live] upsertTooth:', e.message));
      es.charting.addToothHistory({ patientId, toothNumber: num, prevStatus, newStatus: status, surfaces, notes })
        .catch((e) => console.error('[live] toothHistory:', e.message));
    }

    setToothRecords((prev) => ({
      ...prev,
      [patientId]: { ...(prev[patientId] || {}), [num]: record },
    }));

    setToothHistory((prev) => {
      // prevStatus is read from the updater's `prev` so it's always the latest
      // committed value, even across rapid successive edits.
      const prevStatus = prev.find(
        (h) => h.patientId === patientId && h.toothNumber === num
      )?.newStatus;
      const entry = {
        id: uid('th'),
        patientId,
        toothNumber: num,
        prevStatus: prevStatus || 'Healthy',
        newStatus: status,
        surfaces: surfaces || '',
        notes: notes || '',
        at: record.updatedAt,
      };
      return [entry, ...prev].slice(0, MAX_HISTORY);
    });

    logAudit('Clinical', 'Tooth charted', `Tooth ${num} marked ${status}${surfaces ? ` (${surfaces})` : ''}`);
    return record;
  }, [live, toothRecords, logAudit]);

  // Prescriptions: create + lifecycle. Patient/dentist names are resolved and
  // stored on the record so the row renders without re-joining on every render.
  const addPrescription = useCallback((data) => {
    if (live) {
      return es.prescriptions.create(data).then((created) => {
        setPrescriptions((prev) => [created, ...prev]);
        logAudit('Prescriptions', 'Prescription created', `${created.medication} ${created.dosage || ''} for ${created.patientName}`.trim());
        return created;
      }).catch((e) => { console.error('[live] addPrescription:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const dentistObj = dentists.find((d) => d.id === data.dentistId);
    const newPx = {
      ...data,
      id: uid('px'),
      patientName: patientObj?.name || 'Unknown',
      doctorName: dentistObj?.name || 'Unknown',
      date: today(),
      status: data.status || 'active',
    };
    setPrescriptions((prev) => [newPx, ...prev]);
    logAudit('Prescriptions', 'Prescription created', `${newPx.medication} ${newPx.dosage || ''} for ${newPx.patientName}`.trim());
    return newPx;
  }, [live, patients, dentists, logAudit]);

  const updatePrescriptionStatus = useCallback((id, status) => {
    setPrescriptions((prev) => prev.map((px) => (px.id === id ? { ...px, status } : px)));
    if (live) {
      es.prescriptions.updateStatus(id, status).catch((e) => {
        console.error('[live] updatePrescriptionStatus:', e.message);
        reloadLive('prescriptions');
      });
    }
  }, [live, reloadLive]);

  // ── Treatment plans ───────────────────────────────────────────────────────
  // A plan groups several procedure items for a patient. Names are resolved up
  // front so rows render without re-joining. Lifecycle: Proposed → Accepted
  // (bills the whole plan as one invoice) → In Progress → Completed (driven by
  // item completion).
  const addTreatmentPlan = useCallback((data) => {
    if (live) {
      return es.treatmentPlans.create(data, data.items || []).then((created) => {
        setTreatmentPlans((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addTreatmentPlan:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const dentistObj = dentists.find((d) => d.id === data.dentistId);
    const items = (data.items || []).map((it) => ({
      id: uid('pli'),
      procedure: it.procedure,
      toothNumber: it.toothNumber || '-',
      cost: Number(it.cost) || 0,
      done: false,
    }));
    const newPlan = {
      id: uid('plan'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      dentistId: data.dentistId,
      dentistName: dentistObj?.name || 'Unassigned',
      title: data.title?.trim() || 'Treatment Plan',
      status: 'Proposed',
      createdDate: today(),
      invoiceId: null,
      items,
    };
    setTreatmentPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  }, [live, patients, dentists]);

  const updateTreatmentPlanStatus = useCallback((planId, status) => {
    const plan = treatmentPlans.find((p) => p.id === planId);
    if (!plan) return;

    // First acceptance bills the whole plan as a single invoice (routed through
    // the billing state machine - never hand-set balance/status).
    if (status === 'Accepted' && !plan.invoiceId) {
      if (live) {
        (async () => {
          try {
            const total = plan.items.reduce((sum, it) => sum + Number(it.cost || 0), 0);
            const inv = await billingService.createInvoice({ patientId: plan.patientId, totalAmount: total, dueDays: 14 });
            const pat = patients.find((p) => p.id === plan.patientId);
            if (pat && pat.status !== 'Pending Payment') {
              await patientService.update(plan.patientId, { status: 'Pending Payment' });
            }
            setTreatmentPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status, invoiceId: inv.id } : p)));
            await reloadLive('invoices', 'patients');
            logAudit('Treatment Plans', 'Plan accepted & billed', `${plan.title} for ${plan.patientName} - Rs ${total.toLocaleString()}`);
          } catch (e) {
            console.error('[live] plan accept & bill:', e.message);
          }
        })();
        return;
      }
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(now.getDate() + 14);
      const total = plan.items.reduce((sum, it) => sum + Number(it.cost || 0), 0);
      const invoiceId = uid('inv');
      const newInvoice = recalcInvoice({
        id: invoiceId,
        patientId: plan.patientId,
        patientName: plan.patientName,
        invoiceNumber: `INV-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
        date: today(),
        dueDate: dueDate.toISOString().split('T')[0],
        totalAmount: total,
        paidAmount: 0,
      });
      setInvoices((prev) => [newInvoice, ...prev]);
      setPatients((prev) =>
        prev.map((p) => (p.id === plan.patientId && p.status !== 'Pending Payment' ? { ...p, status: 'Pending Payment' } : p))
      );
      setTreatmentPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status, invoiceId } : p)));
      logAudit('Treatment Plans', 'Plan accepted & billed', `${plan.title} for ${plan.patientName} - Rs ${total.toLocaleString()}`);
      return;
    }

    setTreatmentPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status } : p)));
    if (live) {
      es.treatmentPlans.update(planId, { status }).catch((e) => {
        console.error('[live] updatePlanStatus:', e.message);
        reloadLive('treatmentPlans');
      });
    }
  }, [live, patients, reloadLive, treatmentPlans, logAudit]);

  // Toggle a plan item done/undone and derive the plan status from progress.
  const togglePlanItem = useCallback((planId, itemId) => {
    if (live) {
      // Persist the same derivation the local updater applies below.
      const plan = treatmentPlans.find((p) => p.id === planId);
      const item = plan?.items.find((it) => it.id === itemId);
      if (plan && item) {
        const nextDone = !item.done;
        const doneCount = plan.items.filter((it) => (it.id === itemId ? nextDone : it.done)).length;
        const nextStatus = plan.items.length > 0 && doneCount === plan.items.length
          ? 'Completed' : doneCount > 0 ? 'In Progress' : plan.invoiceId ? 'Accepted' : 'Proposed';
        es.treatmentPlans.setItemDone(itemId, nextDone).catch((e) => console.error('[live] setItemDone:', e.message));
        es.treatmentPlans.update(planId, { status: nextStatus }).catch((e) => console.error('[live] plan status:', e.message));
      }
    }
    setTreatmentPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan;
      const items = plan.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it));
      const doneCount = items.filter((it) => it.done).length;
      let status;
      if (items.length > 0 && doneCount === items.length) status = 'Completed';
      else if (doneCount > 0) status = 'In Progress';
      else status = plan.invoiceId ? 'Accepted' : 'Proposed';
      return { ...plan, items, status };
    }));
  }, [live, treatmentPlans]);

  // ── Staff / team ──────────────────────────────────────────────────────────
  const addStaff = useCallback((data) => {
    if (live) {
      return staffService.create({
        ...data,
        name: data.name?.trim() || 'New Staff',
      }).then((created) => {
        setStaff((prev) => [created, ...prev]);
        return created;
      }).catch((e) => {
        console.error('[live] addStaff:', e.message);
        return null;
      });
    }
    const newMember = {
      // Dentists get a dentist-prefixed id so they read consistently with seeds.
      id: data.role === 'Dentist' ? uid('dentist') : uid('staff'),
      name: data.name?.trim() || 'New Staff',
      role: data.role || 'Receptionist',
      specialty: data.specialty?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      status: data.status || 'Active',
      joinedDate: today(),
    };
    setStaff((prev) => [newMember, ...prev]);
    return newMember;
  }, [live]);

  const updateStaffStatus = useCallback((id, status) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    if (live) {
      staffService.updateStatus(id, status).catch((e) => {
        console.error('[live] updateStaffStatus:', e.message);
        reloadLive('staff');
      });
    }
  }, [live, reloadLive]);

  // ── Lab work ──────────────────────────────────────────────────────────────
  const addLabCase = useCallback((data) => {
    if (live) {
      return es.labCases.create(data).then((created) => {
        setLabCases((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addLabCase:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const dentistObj = dentists.find((d) => d.id === data.dentistId);
    const newCase = {
      id: uid('lab'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      dentistId: data.dentistId,
      dentistName: dentistObj?.name || 'Unassigned',
      labName: data.labName?.trim() || 'External Lab',
      caseType: data.caseType || 'Crown',
      toothNumber: data.toothNumber || '-',
      status: 'Sent',
      cost: Number(data.cost) || 0,
      sentDate: today(),
      dueDate: data.dueDate || '',
      receivedDate: null,
      notes: data.notes?.trim() || '',
    };
    setLabCases((prev) => [newCase, ...prev]);
    return newCase;
  }, [live, patients, dentists]);

  // Advance a case; stamp receivedDate the first time it reaches Received/Fitted.
  const updateLabCaseStatus = useCallback((id, status) => {
    if (live) {
      const c = labCases.find((x) => x.id === id);
      const receivedDate = (status === 'Received' || status === 'Fitted') && !c?.receivedDate ? today() : c?.receivedDate ?? null;
      es.labCases.update(id, { status, received_date: receivedDate }).catch((e) => {
        console.error('[live] updateLabCaseStatus:', e.message);
        reloadLive('labCases');
      });
    }
    setLabCases((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const receivedDate = (status === 'Received' || status === 'Fitted') && !c.receivedDate ? today() : c.receivedDate;
      return { ...c, status, receivedDate };
    }));
  }, [live, labCases, reloadLive]);

  // ── Recalls / reminders (email-only) ──────────────────────────────────────
  const addRecall = useCallback((data) => {
    if (live) {
      return es.recalls.create(data).then((created) => {
        setRecalls((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addRecall:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newRecall = {
      id: uid('rec'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      type: data.type || '6-Month Checkup',
      dueDate: data.dueDate || '',
      status: 'Pending',
      channel: data.channel || 'WhatsApp',
      notes: data.notes?.trim() || '',
      lastReminderAt: null,
    };
    setRecalls((prev) => [newRecall, ...prev]);
    return newRecall;
  }, [live, patients]);

  // Simulated reminder send: stamp the date and move Pending → Reminded.
  const sendRecallReminder = useCallback((id) => {
    if (live) {
      const r = recalls.find((x) => x.id === id);
      es.recalls.update(id, {
        status: r?.status === 'Pending' ? 'Reminded' : r?.status,
        last_reminder_at: today(),
      }).catch((e) => { console.error('[live] sendRecallReminder:', e.message); reloadLive('recalls'); });
    }
    setRecalls((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: r.status === 'Pending' ? 'Reminded' : r.status, lastReminderAt: today() } : r
    ));
  }, [live, recalls, reloadLive]);

  const updateRecallStatus = useCallback((id, status) => {
    setRecalls((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (live) {
      es.recalls.update(id, { status }).catch((e) => { console.error('[live] updateRecallStatus:', e.message); reloadLive('recalls'); });
    }
  }, [live, reloadLive]);

  // ── Patient documents (metadata only) ─────────────────────────────────────
  const addDocument = useCallback((data) => {
    if (live) {
      return es.documents.create(data).then((created) => {
        setDocuments((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addDocument:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newDoc = {
      id: uid('doc'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      name: data.name?.trim() || 'Untitled',
      category: data.category || 'Other',
      fileType: data.fileType || 'FILE',
      size: Number(data.size) || 0,
      uploadedDate: today(),
      uploadedBy: data.uploadedBy?.trim() || 'Staff',
      notes: data.notes?.trim() || '',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  }, [live, patients]);

  const deleteDocument = useCallback((id) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (live) {
      es.documents.remove(id).catch((e) => { console.error('[live] deleteDocument:', e.message); reloadLive('documents'); });
      // Also remove the stored file so it doesn't orphan in the bucket.
      if (doc?.storagePath) {
        storageService.remove('documents', doc.storagePath).catch((e) => console.error('[live] document file cleanup:', e.message));
      }
    }
  }, [live, reloadLive, documents]);

  // ── Clinic expenses ───────────────────────────────────────────────────────
  const addExpense = useCallback((data) => {
    if (live) {
      return es.expenses.create(data).then((created) => {
        setExpenses((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addExpense:', e.message); return null; });
    }
    const newExpense = {
      id: uid('exp'),
      date: data.date || today(),
      category: data.category || 'Other',
      vendor: data.vendor?.trim() || '',
      description: data.description?.trim() || '',
      amount: Number(data.amount) || 0,
      method: data.method || 'Cash',
      status: data.status || 'Paid',
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  }, [live]);

  const updateExpenseStatus = useCallback((id, status) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    if (live) {
      es.expenses.update(id, { status }).catch((e) => { console.error('[live] updateExpenseStatus:', e.message); reloadLive('expenses'); });
    }
  }, [live, reloadLive]);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (live) {
      es.expenses.remove(id).catch((e) => { console.error('[live] deleteExpense:', e.message); reloadLive('expenses'); });
    }
  }, [live, reloadLive]);

  // ── Insurance claims ──────────────────────────────────────────────────────
  const addClaim = useCallback((data) => {
    if (live) {
      return es.claims.create(data).then((created) => {
        setClaims((prev) => [created, ...prev]);
        logAudit('Insurance', 'Claim submitted', `${created.patientName} - ${created.payer}, Rs ${created.claimedAmount.toLocaleString()}`);
        return created;
      }).catch((e) => { console.error('[live] addClaim:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newClaim = {
      id: uid('clm'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      payer: data.payer || 'Self-Pay / None',
      policyNumber: data.policyNumber?.trim() || '',
      serviceDate: data.serviceDate || today(),
      submittedDate: today(),
      procedures: data.procedures?.trim() || '',
      claimedAmount: Number(data.claimedAmount) || 0,
      approvedAmount: 0,
      status: data.status || 'Submitted',
      notes: data.notes?.trim() || '',
    };
    setClaims((prev) => [newClaim, ...prev]);
    logAudit('Insurance', 'Claim submitted', `${newClaim.patientName} - ${newClaim.payer}, Rs ${newClaim.claimedAmount.toLocaleString()}`);
    return newClaim;
  }, [live, patients, logAudit]);

  // Advancing to Approved/Paid auto-fills the approved amount (full) if unset;
  // Denied zeroes it. Adjust manually later if partial.
  const updateClaimStatus = useCallback((id, status) => {
    if (live) {
      const c = claims.find((x) => x.id === id);
      let approvedAmount = c?.approvedAmount ?? 0;
      if ((status === 'Approved' || status === 'Paid') && !approvedAmount) approvedAmount = c?.claimedAmount ?? 0;
      if (status === 'Denied') approvedAmount = 0;
      es.claims.update(id, { status, approved_amount: approvedAmount }).catch((e) => {
        console.error('[live] updateClaimStatus:', e.message);
        reloadLive('claims');
      });
    }
    setClaims((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      let approvedAmount = c.approvedAmount;
      if ((status === 'Approved' || status === 'Paid') && !approvedAmount) approvedAmount = c.claimedAmount;
      if (status === 'Denied') approvedAmount = 0;
      return { ...c, status, approvedAmount };
    }));
  }, [live, claims, reloadLive]);

  const deleteClaim = useCallback((id) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
    if (live) {
      es.claims.remove(id).catch((e) => { console.error('[live] deleteClaim:', e.message); reloadLive('claims'); });
    }
  }, [live, reloadLive]);

  // ── Online booking requests ───────────────────────────────────────────────
  const addBookingRequest = useCallback((data) => {
    if (live) {
      return es.bookings.create(data).then((created) => {
        setBookingRequests((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addBookingRequest:', e.message); return null; });
    }
    const newReq = {
      id: uid('bk'),
      patientName: data.patientName?.trim() || 'New Patient',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      patientId: data.patientId || null,
      preferredDate: data.preferredDate || today(),
      preferredTime: data.preferredTime || '10:00 AM',
      service: data.service || 'Consultation',
      reason: data.reason?.trim() || '',
      status: 'Pending',
      source: data.source || 'Online',
      submittedDate: today(),
      appointmentId: null,
    };
    setBookingRequests((prev) => [newReq, ...prev]);
    return newReq;
  }, [live]);

  // Confirming a request turns it into a real scheduled appointment. If it isn't
  // linked to an existing patient, a new patient record is created from it.
  // Built inline (not via addPatient/addAppointment) so names resolve without
  // waiting for the just-created patient to land in state.
  const confirmBookingRequest = useCallback((id, { dentistId, patientId } = {}) => {
    const req = bookingRequests.find((r) => r.id === id);
    if (!req) return;

    if (live) {
      // Real records all the way down: patient (if new) → appointment →
      // booking marked Confirmed, then one consistent refetch.
      return (async () => {
        try {
          let pid = patientId || req.patientId;
          if (!pid) {
            const createdPatient = await patientService.create({
              name: req.patientName, phone: req.phone, email: req.email,
              allergies: 'None', status: 'Active',
            });
            pid = createdPatient.id;
          }
          const appt = await appointmentService.create({
            patientId: pid, dentistId: dentistId || null,
            date: req.preferredDate, time: req.preferredTime, type: req.service,
            notes: req.reason || 'Booked online', status: 'Scheduled',
          });
          await es.bookings.update(id, { status: 'Confirmed', patient_id: pid, appointment_id: appt.id });
          await reloadLive('patients', 'appointments', 'bookings');
          logAudit('Online Booking', 'Booking confirmed', `${appt.patientName} - ${req.service} on ${req.preferredDate} at ${req.preferredTime}`);
          return appt.id;
        } catch (e) {
          console.error('[live] confirmBookingRequest:', e.message);
          return null;
        }
      })();
    }

    let pid = patientId || req.patientId;
    let pname = req.patientName;

    if (!pid) {
      pid = uid('pat');
      setPatients((prev) => [{
        id: pid, name: req.patientName, gender: '', dob: '',
        phone: req.phone || '', email: req.email || '', address: '',
        allergies: 'None', status: 'Active', registrationDate: today(), bloodGroup: '',
      }, ...prev]);
    } else {
      const existing = patients.find((p) => p.id === pid);
      if (existing) pname = existing.name;
    }

    const dentistObj = dentists.find((d) => d.id === dentistId);
    const apptId = uid('appt');
    setAppointments((prev) => [{
      id: apptId, patientId: pid, patientName: pname,
      dentistId: dentistId || '', dentistName: dentistObj?.name || 'Unassigned',
      date: req.preferredDate, time: req.preferredTime, type: req.service,
      notes: req.reason || 'Booked online', status: 'Scheduled',
    }, ...prev]);

    setBookingRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Confirmed', appointmentId: apptId, patientId: pid } : r)));
    logAudit('Online Booking', 'Booking confirmed', `${pname} - ${req.service} on ${req.preferredDate} at ${req.preferredTime}`);
    return apptId;
  }, [live, bookingRequests, patients, dentists, reloadLive, logAudit]);

  const declineBookingRequest = useCallback((id) => {
    setBookingRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Declined' } : r)));
    if (live) {
      es.bookings.update(id, { status: 'Declined' }).catch((e) => { console.error('[live] declineBooking:', e.message); reloadLive('bookings'); });
    }
  }, [live, reloadLive]);

  // ── Memberships / in-house plans ──────────────────────────────────────────
  const addMembershipPlan = useCallback((data) => {
    if (live) {
      return es.memberships.createPlan(data).then((created) => {
        setMembershipPlans((prev) => [...prev, created]);
        return created;
      }).catch((e) => { console.error('[live] addMembershipPlan:', e.message); return null; });
    }
    const newPlan = {
      id: uid('plan'),
      name: data.name?.trim() || 'New Plan',
      price: Number(data.price) || 0,
      cycle: data.cycle || 'Annual',
      discount: Number(data.discount) || 0,
      benefits: data.benefits?.trim() || '',
      color: data.color || '#0F4C81',
    };
    setMembershipPlans((prev) => [...prev, newPlan]);
    return newPlan;
  }, [live]);

  const enrollMembership = useCallback((data) => {
    const patientObj = patients.find((p) => p.id === data.patientId);
    const plan = membershipPlans.find((p) => p.id === data.planId);
    const start = data.startDate || today();

    if (live) {
      return es.memberships.enroll({
        patientId: data.patientId, planId: data.planId, startDate: start,
        renewalDate: addCycle(plan?.cycle || 'Annual', new Date(start)),
        price: plan?.price || 0,
      }).then((created) => {
        setMemberships((prev) => [created, ...prev]);
        logAudit('Memberships', 'Patient enrolled', `${created.patientName} - ${created.planName}`);
        return created;
      }).catch((e) => { console.error('[live] enrollMembership:', e.message); return null; });
    }
    const newMembership = {
      id: uid('mem'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      planId: data.planId,
      planName: plan?.name || 'Plan',
      cycle: plan?.cycle || 'Annual',
      startDate: start,
      renewalDate: addCycle(plan?.cycle || 'Annual', new Date(start)),
      status: 'Active',
      price: plan?.price || 0,
    };
    setMemberships((prev) => [newMembership, ...prev]);
    logAudit('Memberships', 'Patient enrolled', `${newMembership.patientName} - ${newMembership.planName}`);
    return newMembership;
  }, [live, patients, membershipPlans, logAudit]);

  const updateMembershipStatus = useCallback((id, status) => {
    setMemberships((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (live) {
      es.memberships.update(id, { status }).catch((e) => { console.error('[live] updateMembershipStatus:', e.message); reloadLive('memberships'); });
    }
  }, [live, reloadLive]);

  // Renew: extend the renewal date by one cycle from the later of (now, current
  // renewal) and reactivate.
  const renewMembership = useCallback((id) => {
    if (live) {
      const m = memberships.find((x) => x.id === id);
      if (m) {
        const fromTime = Math.max(new Date(m.renewalDate || today()).getTime(), Date.now());
        es.memberships.update(id, {
          renewal_date: addCycle(m.cycle || 'Annual', new Date(fromTime)),
          status: 'Active',
        }).catch((e) => { console.error('[live] renewMembership:', e.message); reloadLive('memberships'); });
      }
    }
    setMemberships((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const fromTime = Math.max(new Date(m.renewalDate || today()).getTime(), Date.now());
      return { ...m, renewalDate: addCycle(m.cycle || 'Annual', new Date(fromTime)), status: 'Active' };
    }));
  }, [live, memberships, reloadLive]);

  // ── Digital forms / e-consent ─────────────────────────────────────────────
  // Templates are a read-only constant in the Forms page; the page passes the
  // resolved templateName/category in `data` so the context stays lean.
  const assignForm = useCallback((data) => {
    if (live) {
      return es.forms.create(data).then((created) => {
        setFormSubmissions((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] assignForm:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newSub = {
      id: uid('fs'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      templateId: data.templateId,
      templateName: data.templateName || 'Form',
      category: data.category || 'Other',
      status: 'Pending',
      sentDate: today(),
      completedDate: null,
      signedBy: null,
      signatureDate: null,
    };
    setFormSubmissions((prev) => [newSub, ...prev]);
    return newSub;
  }, [live, patients]);

  // Simulated e-signature: capture the typed signer name + date and complete.
  // Target resolved from closure (not inside the updater) so the audit entry
  // fires exactly once - updaters can be re-invoked by React.
  const completeForm = useCallback((id, signedBy) => {
    const target = formSubmissions.find((s) => s.id === id);
    const signer = signedBy?.trim() || target?.patientName || 'Patient';
    setFormSubmissions((prev) => prev.map((s) =>
      s.id === id ? { ...s, status: 'Completed', completedDate: today(), signedBy: signer, signatureDate: today() } : s
    ));
    if (live) {
      es.forms.update(id, { status: 'Completed', completed_date: today(), signed_by: signer, signature_date: today() })
        .catch((e) => { console.error('[live] completeForm:', e.message); reloadLive('forms'); });
    }
    if (target) logAudit('Forms', 'Form e-signed', `${target.templateName} signed by ${signer}`);
  }, [live, formSubmissions, reloadLive, logAudit]);

  const deleteFormSubmission = useCallback((id) => {
    setFormSubmissions((prev) => prev.filter((s) => s.id !== id));
    if (live) {
      es.forms.remove(id).catch((e) => { console.error('[live] deleteForm:', e.message); reloadLive('forms'); });
    }
  }, [live, reloadLive]);

  // ── Perio charting ────────────────────────────────────────────────────────
  const updatePerioTooth = useCallback((patientId, toothNumber, data) => {
    const num = Number(toothNumber);
    if (live) {
      es.charting.upsertPerio(patientId, num, data).catch((e) => console.error('[live] upsertPerio:', e.message));
    }
    setPerioCharts((prev) => ({
      ...prev,
      [patientId]: {
        ...(prev[patientId] || {}),
        [num]: { depths: data.depths || [], bop: Boolean(data.bop), updatedAt: new Date().toISOString() },
      },
    }));
    logAudit('Clinical', 'Perio recorded', `Tooth ${num} - depths ${( data.depths || []).join('/')}${data.bop ? ', BOP' : ''}`);
  }, [live, logAudit]);

  // ── Locations (multi-branch) ──────────────────────────────────────────────
  // The primary location is the fallback home for any staff member without an
  // explicit locationId (a clinic that just enabled multi-location shouldn't
  // see its whole roster as "unassigned").
  const primaryLocationId = useMemo(
    () => (locations.find((l) => l.isPrimary) || locations[0])?.id || '',
    [locations]
  );

  const addLocation = useCallback((data) => {
    if (live) {
      return es.locations.create(data).then((created) => {
        setLocations((prev) => [...prev, created]);
        logAudit('Locations', 'Location added', created.name);
        return created;
      }).catch((e) => { console.error('[live] addLocation:', e.message); return null; });
    }
    const newLocation = {
      id: uid('loc'),
      name: data.name?.trim() || 'New Location',
      address: data.address?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      manager: data.manager?.trim() || '',
      chairs: Number(data.chairs) || 1,
      openHours: data.openHours?.trim() || '',
      status: 'Active',
      color: data.color || '#0F4C81',
      isPrimary: false,
    };
    setLocations((prev) => [...prev, newLocation]);
    logAudit('Locations', 'Location added', newLocation.name);
    return newLocation;
  }, [live, logAudit]);

  const updateLocationStatus = useCallback((id, status) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (live) {
      es.locations.update(id, { status }).catch((e) => { console.error('[live] updateLocationStatus:', e.message); reloadLive('locations'); });
    }
  }, [live, reloadLive]);

  // Move a staff member to a branch (stored on the staff record itself so the
  // roster stays the single source of truth).
  const assignStaffLocation = useCallback((staffId, locationId) => {
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, locationId } : s)));
    if (live) {
      staffService.assignLocation(staffId, locationId).catch((e) => {
        console.error('[live] assignStaffLocation:', e.message);
        reloadLive('staff');
      });
    }
  }, [live, reloadLive]);

  // ── Marketing campaigns ───────────────────────────────────────────────────
  const addCampaign = useCallback((data) => {
    if (live) {
      return es.campaigns.create(data).then((created) => {
        setCampaigns((prev) => [created, ...prev]);
        return created;
      }).catch((e) => { console.error('[live] addCampaign:', e.message); return null; });
    }
    const newCampaign = {
      id: uid('cmp'),
      name: data.name?.trim() || 'Untitled Campaign',
      channel: 'Email',
      segment: data.segment || 'All Patients',
      subject: data.subject?.trim() || '',
      body: data.body?.trim() || '',
      status: 'Draft',
      recipients: 0,
      createdDate: today(),
      sentAt: null,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    return newCampaign;
  }, [live]);

  // Simulated email blast: the page computes the live audience size for the
  // campaign's segment and passes it in; we stamp it with the send date.
  const sendCampaign = useCallback((id, recipients) => {
    const target = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.map((c) =>
      c.id === id ? { ...c, status: 'Sent', recipients: Number(recipients) || 0, sentAt: today() } : c
    ));
    if (live) {
      es.campaigns.update(id, { status: 'Sent', recipients: Number(recipients) || 0, sent_at: today() })
        .catch((e) => { console.error('[live] sendCampaign:', e.message); reloadLive('campaigns'); });
    }
    if (target) logAudit('Marketing', 'Campaign sent', `"${target.name}" to ${recipients} recipient${recipients === 1 ? '' : 's'} (${target.segment})`);
  }, [live, campaigns, reloadLive, logAudit]);

  const deleteCampaign = useCallback((id) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (live) {
      es.campaigns.remove(id).catch((e) => { console.error('[live] deleteCampaign:', e.message); reloadLive('campaigns'); });
    }
  }, [live, reloadLive]);

  // ── Imaging records (metadata only) ───────────────────────────────────────
  const addImagingRecord = useCallback((data) => {
    if (live) {
      return es.imaging.create(data).then((created) => {
        setImagingRecords((prev) => [created, ...prev]);
        logAudit('Imaging', 'Image recorded', `${created.type} for ${created.patientName} (tooth ${created.toothNumber})`);
        return created;
      }).catch((e) => { console.error('[live] addImagingRecord:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newRecord = {
      id: uid('img'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      type: data.type || 'Periapical X-Ray',
      toothNumber: data.toothNumber || 'All',
      date: data.date || today(),
      takenBy: data.takenBy?.trim() || 'Staff',
      notes: data.notes?.trim() || '',
    };
    setImagingRecords((prev) => [newRecord, ...prev]);
    logAudit('Imaging', 'Image recorded', `${newRecord.type} for ${newRecord.patientName} (tooth ${newRecord.toothNumber})`);
    return newRecord;
  }, [live, patients, logAudit]);

  const deleteImagingRecord = useCallback((id) => {
    const rec = imagingRecords.find((r) => r.id === id);
    setImagingRecords((prev) => prev.filter((r) => r.id !== id));
    if (live) {
      es.imaging.remove(id).catch((e) => { console.error('[live] deleteImaging:', e.message); reloadLive('imaging'); });
      // Also remove the stored image so it doesn't orphan in the bucket.
      if (rec?.storagePath) {
        storageService.remove('imaging', rec.storagePath).catch((e) => console.error('[live] imaging file cleanup:', e.message));
      }
    }
  }, [live, reloadLive, imagingRecords]);

  // ── Referrals ─────────────────────────────────────────────────────────────
  // Inbound referrals can arrive before the patient exists, so patientId is
  // optional - the free-text patientName is authoritative in that case.
  const addReferral = useCallback((data) => {
    if (live) {
      const patientObj = patients.find((p) => p.id === data.patientId);
      return es.referrals.create({
        ...data,
        patientName: patientObj?.name || data.patientName?.trim() || 'Unknown',
      }).then((created) => {
        setReferrals((prev) => [created, ...prev]);
        logAudit('Referrals', `${created.direction} referral created`, `${created.patientName} ↔ ${created.provider} (${created.specialty})`);
        return created;
      }).catch((e) => { console.error('[live] addReferral:', e.message); return null; });
    }
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newReferral = {
      id: uid('ref'),
      direction: data.direction === 'Inbound' ? 'Inbound' : 'Outbound',
      patientId: data.patientId || null,
      patientName: patientObj?.name || data.patientName?.trim() || 'Unknown',
      provider: data.provider?.trim() || '',
      practice: data.practice?.trim() || '',
      specialty: data.specialty?.trim() || '',
      reason: data.reason?.trim() || '',
      date: today(),
      status: 'Pending',
      notes: data.notes?.trim() || '',
    };
    setReferrals((prev) => [newReferral, ...prev]);
    logAudit('Referrals', `${newReferral.direction} referral created`, `${newReferral.patientName} ↔ ${newReferral.provider} (${newReferral.specialty})`);
    return newReferral;
  }, [live, patients, logAudit]);

  const updateReferralStatus = useCallback((id, status) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (live) {
      es.referrals.update(id, { status }).catch((e) => { console.error('[live] updateReferralStatus:', e.message); reloadLive('referrals'); });
    }
  }, [live, reloadLive]);

  const deleteReferral = useCallback((id) => {
    setReferrals((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Patient messaging (two-way inbox) ─────────────────────────────────────
  const sendMessage = useCallback((conversationId, text) => {
    const body = text?.trim();
    if (!body) return;
    setConversations((prev) => prev.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, { id: uid('msg'), from: 'clinic', text: body, at: new Date().toISOString() }] }
        : c
    ));
    if (live) {
      es.conversations.addMessage(conversationId, body).catch((e) => {
        console.error('[live] sendMessage:', e.message);
        reloadLive('conversations');
      });
    }
  }, [live, reloadLive]);

  const markConversationRead = useCallback((conversationId) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c)));
    if (live) {
      es.conversations.update(conversationId, { unread: false }).catch((e) => console.error('[live] markRead:', e.message));
    }
  }, [live]);

  // Start (or continue) a thread with a patient. If a conversation already
  // exists for that patient, the message is appended there instead of
  // creating a duplicate thread. Returns the conversation id.
  const startConversation = useCallback(({ patientId, channel = 'WhatsApp', text }) => {
    const body = text?.trim();
    if (!patientId || !body) return null;
    if (live) {
      return (async () => {
        try {
          const existing = conversations.find((c) => c.patientId === patientId);
          let convId = existing?.id;
          if (!convId) {
            const conv = await es.conversations.create({ patientId, channel });
            convId = conv.id;
          } else if (existing.channel !== channel) {
            await es.conversations.update(convId, { channel });
          }
          await es.conversations.addMessage(convId, body);
          await reloadLive('conversations');
          return convId;
        } catch (e) {
          console.error('[live] startConversation:', e.message);
          return null;
        }
      })();
    }
    const existing = conversations.find((c) => c.patientId === patientId);
    const message = { id: uid('msg'), from: 'clinic', text: body, at: new Date().toISOString() };
    if (existing) {
      setConversations((prev) => prev.map((c) =>
        c.id === existing.id ? { ...c, channel, messages: [...c.messages, message] } : c
      ));
      return existing.id;
    }
    const patientObj = patients.find((p) => p.id === patientId);
    const newConv = {
      id: uid('conv'),
      patientId,
      patientName: patientObj?.name || 'Unknown',
      channel,
      unread: false,
      messages: [message],
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv.id;
  }, [live, conversations, patients, reloadLive]);

  const getTodayAppointments = useCallback(() => {
    const todayStr = today();
    return appointments.filter((a) => a.date === todayStr);
  }, [appointments]);

  const getTodayMetrics = useCallback(() => {
    const todayStr = today();
    const todayAppts = appointments.filter((a) => a.date === todayStr);
    const completedTreatments = treatments.filter((t) => t.date === todayStr);
    const revenueToday = payments
      .filter((p) => p.date === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPendingPayments = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const totalPatientsToday = new Set([
      ...todayAppts.map((a) => a.patientId),
      ...completedTreatments.map((t) => t.patientId),
    ]).size;

    return {
      totalPatientsToday,
      appointmentsTodayCount: todayAppts.length,
      completedTreatmentsCount: completedTreatments.length,
      revenueToday,
      totalPendingPayments,
    };
  }, [appointments, treatments, payments, invoices]);

  // Memoise the context value so consumers only re-render when state or a
  // handler identity actually changes - not on every provider render.
  const value = useMemo(
    () => ({
      dataLive: live,
      coreLoading,
      patients,
      appointments,
      treatments,
      invoices,
      payments,
      dentists,
      toothRecords,
      toothHistory,
      updateTooth,
      prescriptions,
      addPrescription,
      updatePrescriptionStatus,
      treatmentPlans,
      addTreatmentPlan,
      updateTreatmentPlanStatus,
      togglePlanItem,
      staff,
      addStaff,
      updateStaffStatus,
      labCases,
      addLabCase,
      updateLabCaseStatus,
      recalls,
      addRecall,
      sendRecallReminder,
      updateRecallStatus,
      documents,
      addDocument,
      deleteDocument,
      expenses,
      addExpense,
      updateExpenseStatus,
      deleteExpense,
      claims,
      addClaim,
      updateClaimStatus,
      deleteClaim,
      bookingRequests,
      addBookingRequest,
      confirmBookingRequest,
      declineBookingRequest,
      membershipPlans,
      memberships,
      addMembershipPlan,
      enrollMembership,
      updateMembershipStatus,
      renewMembership,
      formSubmissions,
      assignForm,
      completeForm,
      deleteFormSubmission,
      perioCharts,
      updatePerioTooth,
      auditLog,
      logAudit,
      locations,
      primaryLocationId,
      addLocation,
      updateLocationStatus,
      assignStaffLocation,
      campaigns,
      addCampaign,
      sendCampaign,
      deleteCampaign,
      imagingRecords,
      addImagingRecord,
      deleteImagingRecord,
      referrals,
      addReferral,
      updateReferralStatus,
      deleteReferral,
      conversations,
      sendMessage,
      markConversationRead,
      startConversation,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointmentStatus,
      assignDentist,
      addTreatment,
      addPayment,
      getTodayAppointments,
      getTodayMetrics,
    }),
    [
      live, coreLoading,
      patients, appointments, treatments, invoices, payments, dentists,
      toothRecords, toothHistory, updateTooth, prescriptions, addPrescription,
      updatePrescriptionStatus, treatmentPlans, addTreatmentPlan,
      updateTreatmentPlanStatus, togglePlanItem, staff, addStaff, updateStaffStatus,
      labCases, addLabCase, updateLabCaseStatus, recalls, addRecall,
      sendRecallReminder, updateRecallStatus, documents, addDocument, deleteDocument,
      expenses, addExpense, updateExpenseStatus, deleteExpense,
      claims, addClaim, updateClaimStatus, deleteClaim,
      bookingRequests, addBookingRequest, confirmBookingRequest, declineBookingRequest,
      membershipPlans, memberships, addMembershipPlan, enrollMembership,
      updateMembershipStatus, renewMembership, formSubmissions, assignForm,
      completeForm, deleteFormSubmission, perioCharts, updatePerioTooth,
      auditLog, logAudit,
      locations, primaryLocationId, addLocation, updateLocationStatus, assignStaffLocation,
      campaigns, addCampaign, sendCampaign, deleteCampaign,
      imagingRecords, addImagingRecord, deleteImagingRecord,
      referrals, addReferral, updateReferralStatus, deleteReferral,
      conversations, sendMessage, markConversationRead, startConversation,
      addPatient, updatePatient, deletePatient,
      addAppointment, updateAppointmentStatus, assignDentist, addTreatment,
      addPayment, getTodayAppointments, getTodayMetrics,
    ]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
