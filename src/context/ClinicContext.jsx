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
  mockAuditLog
} from '../utils/mockData';
import { recalcInvoice } from '../utils/billing';

const STORAGE_KEY = 'dental-clinic-app-data';

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

  const [patients, setPatients] = useState(() => stored.patients || mockPatients);
  const [appointments, setAppointments] = useState(() => stored.appointments || mockAppointments);
  const [treatments, setTreatments] = useState(() => stored.treatments || mockTreatments);
  // Normalise every invoice through the billing state machine on load so
  // balanceDue / status / paymentPercentage are always derived from the
  // amounts — this self-heals any inconsistent persisted or seed data.
  const [invoices, setInvoices] = useState(() =>
    (stored.invoices || mockInvoices).map((inv) => recalcInvoice(inv))
  );
  const [payments, setPayments] = useState(() => stored.payments || mockPayments);

  // Staff / team is the master list; dentists are derived from it so every
  // dentist dropdown (appointments, treatments, prescriptions, plans) reflects
  // the staff roster — single source of truth, no duplicated dentist data.
  const [staff, setStaff] = useState(() => stored.staff || mockStaff);
  const dentists = useMemo(() => staff.filter((s) => s.role === 'Dentist'), [staff]);

  // Dental charting (odontogram) state.
  // toothRecords: { [patientId]: { [toothNumber]: { status, surfaces, notes, updatedAt } } }
  // toothHistory: append-only audit log of every charting change (capped).
  const [toothRecords, setToothRecords] = useState(() => stored.toothRecords || {});
  const [toothHistory, setToothHistory] = useState(() => stored.toothHistory || []);

  // Prescriptions (persisted, with an active ↔ completed lifecycle).
  const [prescriptions, setPrescriptions] = useState(() => stored.prescriptions || []);

  // Treatment plans (multi-visit, phased; persisted).
  const [treatmentPlans, setTreatmentPlans] = useState(() => stored.treatmentPlans || mockTreatmentPlans);

  // External lab cases (Sent → In Progress → Received → Fitted; persisted).
  const [labCases, setLabCases] = useState(() => stored.labCases || mockLabCases);

  // Patient recalls / reminders (email-only; persisted).
  const [recalls, setRecalls] = useState(() => stored.recalls || mockRecalls);

  // Patient documents (metadata only — no file bytes; persisted).
  const [documents, setDocuments] = useState(() => stored.documents || mockDocuments);

  // Clinic expenses (spending side of the ledger; persisted).
  const [expenses, setExpenses] = useState(() => stored.expenses || mockExpenses);

  // Insurance claims (Draft → Submitted → In Review → Approved/Denied → Paid; persisted).
  const [claims, setClaims] = useState(() => stored.claims || mockClaims);

  // Online booking requests (Pending → Confirmed/Declined; persisted).
  const [bookingRequests, setBookingRequests] = useState(() => stored.bookingRequests || mockBookingRequests);

  // Membership plans + patient enrollments (in-house plans; persisted).
  const [membershipPlans, setMembershipPlans] = useState(() => stored.membershipPlans || mockMembershipPlans);
  const [memberships, setMemberships] = useState(() => stored.memberships || mockMemberships);

  // Digital form submissions (Pending → Completed/e-signed; persisted).
  const [formSubmissions, setFormSubmissions] = useState(() => stored.formSubmissions || mockFormSubmissions);

  // Periodontal charts: { [patientId]: { [toothNumber]: { depths:[6], bop } } } (persisted).
  const [perioCharts, setPerioCharts] = useState(() => stored.perioCharts || mockPerioCharts);

  // Audit log — append-only activity trail, capped (persisted).
  const [auditLog, setAuditLog] = useState(() => stored.auditLog || mockAuditLog);

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
        })
      );
    } catch {
      // Storage full or unavailable (e.g. private mode). The app keeps working
      // from in-memory state; we just can't persist this change.
    }
  }, [patients, appointments, treatments, invoices, payments, toothRecords, toothHistory, prescriptions, treatmentPlans, staff, labCases, recalls, documents, expenses, claims, bookingRequests, membershipPlans, memberships, formSubmissions, perioCharts, auditLog]);

  // Append an audit entry. User is read from the auth session at call time so
  // entries carry whoever is signed in. Stable identity ([]) — safe in deps.
  const logAudit = useCallback((module, action, detail) => {
    let user = 'Staff';
    try {
      const raw = window.localStorage.getItem('dental-auth') || window.sessionStorage.getItem('dental-auth');
      user = raw ? (JSON.parse(raw)?.name || 'Staff') : 'Staff';
    } catch { /* keep default */ }
    setAuditLog((prev) => [
      { id: uid('aud'), at: new Date().toISOString(), user, module, action, detail },
      ...prev,
    ].slice(0, MAX_HISTORY));
  }, []);

  const addPatient = useCallback((patientData) => {
    const newPatient = {
      ...patientData,
      id: uid('pat'),
      registrationDate: today(),
      status: patientData.status || 'Active',
    };
    setPatients((prev) => [newPatient, ...prev]);
    logAudit('Patients', 'Patient registered', newPatient.name);
    return newPatient;
  }, [logAudit]);

  const updatePatient = useCallback((patientId, updates) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
    );
  }, []);

  const addAppointment = useCallback((apptData) => {
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
    logAudit('Appointments', 'Appointment scheduled', `${newAppt.patientName} — ${newAppt.type} with ${newAppt.dentistName} on ${newAppt.date}`);
    return newAppt;
  }, [patients, dentists, logAudit]);

  const updateAppointmentStatus = useCallback((apptId, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a))
    );
  }, []);

  const assignDentist = useCallback((apptId, dentistId) => {
    const dentistObj = dentists.find((d) => d.id === dentistId);
    if (!dentistObj) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apptId ? { ...a, dentistId, dentistName: dentistObj.name } : a
      )
    );
  }, [dentists]);

  const addTreatment = useCallback((treatmentData) => {
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
    // paymentPercentage are always consistent — never hand-set.
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

    logAudit('Treatments', 'Treatment logged', `${newTreatment.patientName} — ${newTreatment.type} (tooth ${newTreatment.toothNumber}), invoice ${newInvoice.invoiceNumber} generated`);
    return newTreatment;
  }, [patients, logAudit]);

  const addPayment = useCallback((paymentData) => {
    // Resolve the target invoice up front so payment metadata and the
    // patient-status decision are based on real values — not on flags mutated
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
  }, [invoices, logAudit]);

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
  }, [logAudit]);

  // Prescriptions: create + lifecycle. Patient/dentist names are resolved and
  // stored on the record so the row renders without re-joining on every render.
  const addPrescription = useCallback((data) => {
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
  }, [patients, dentists, logAudit]);

  const updatePrescriptionStatus = useCallback((id, status) => {
    setPrescriptions((prev) => prev.map((px) => (px.id === id ? { ...px, status } : px)));
  }, []);

  // ── Treatment plans ───────────────────────────────────────────────────────
  // A plan groups several procedure items for a patient. Names are resolved up
  // front so rows render without re-joining. Lifecycle: Proposed → Accepted
  // (bills the whole plan as one invoice) → In Progress → Completed (driven by
  // item completion).
  const addTreatmentPlan = useCallback((data) => {
    const patientObj = patients.find((p) => p.id === data.patientId);
    const dentistObj = dentists.find((d) => d.id === data.dentistId);
    const items = (data.items || []).map((it) => ({
      id: uid('pli'),
      procedure: it.procedure,
      toothNumber: it.toothNumber || '—',
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
  }, [patients, dentists]);

  const updateTreatmentPlanStatus = useCallback((planId, status) => {
    const plan = treatmentPlans.find((p) => p.id === planId);
    if (!plan) return;

    // First acceptance bills the whole plan as a single invoice (routed through
    // the billing state machine — never hand-set balance/status).
    if (status === 'Accepted' && !plan.invoiceId) {
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
      logAudit('Treatment Plans', 'Plan accepted & billed', `${plan.title} for ${plan.patientName} — Rs ${total.toLocaleString()}`);
      return;
    }

    setTreatmentPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status } : p)));
  }, [treatmentPlans, logAudit]);

  // Toggle a plan item done/undone and derive the plan status from progress.
  const togglePlanItem = useCallback((planId, itemId) => {
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
  }, []);

  // ── Staff / team ──────────────────────────────────────────────────────────
  const addStaff = useCallback((data) => {
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
  }, []);

  const updateStaffStatus = useCallback((id, status) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  // ── Lab work ──────────────────────────────────────────────────────────────
  const addLabCase = useCallback((data) => {
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
      toothNumber: data.toothNumber || '—',
      status: 'Sent',
      cost: Number(data.cost) || 0,
      sentDate: today(),
      dueDate: data.dueDate || '',
      receivedDate: null,
      notes: data.notes?.trim() || '',
    };
    setLabCases((prev) => [newCase, ...prev]);
    return newCase;
  }, [patients, dentists]);

  // Advance a case; stamp receivedDate the first time it reaches Received/Fitted.
  const updateLabCaseStatus = useCallback((id, status) => {
    setLabCases((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const receivedDate = (status === 'Received' || status === 'Fitted') && !c.receivedDate ? today() : c.receivedDate;
      return { ...c, status, receivedDate };
    }));
  }, []);

  // ── Recalls / reminders (email-only) ──────────────────────────────────────
  const addRecall = useCallback((data) => {
    const patientObj = patients.find((p) => p.id === data.patientId);
    const newRecall = {
      id: uid('rec'),
      patientId: data.patientId,
      patientName: patientObj?.name || 'Unknown',
      type: data.type || '6-Month Checkup',
      dueDate: data.dueDate || '',
      status: 'Pending',
      channel: 'Email',
      notes: data.notes?.trim() || '',
      lastReminderAt: null,
    };
    setRecalls((prev) => [newRecall, ...prev]);
    return newRecall;
  }, [patients]);

  // Simulated email reminder: stamp the send date and move Pending → Reminded.
  const sendRecallReminder = useCallback((id) => {
    setRecalls((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: r.status === 'Pending' ? 'Reminded' : r.status, lastReminderAt: today() } : r
    ));
  }, []);

  const updateRecallStatus = useCallback((id, status) => {
    setRecalls((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  // ── Patient documents (metadata only) ─────────────────────────────────────
  const addDocument = useCallback((data) => {
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
  }, [patients]);

  const deleteDocument = useCallback((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // ── Clinic expenses ───────────────────────────────────────────────────────
  const addExpense = useCallback((data) => {
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
  }, []);

  const updateExpenseStatus = useCallback((id, status) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Insurance claims ──────────────────────────────────────────────────────
  const addClaim = useCallback((data) => {
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
    logAudit('Insurance', 'Claim submitted', `${newClaim.patientName} — ${newClaim.payer}, Rs ${newClaim.claimedAmount.toLocaleString()}`);
    return newClaim;
  }, [patients, logAudit]);

  // Advancing to Approved/Paid auto-fills the approved amount (full) if unset;
  // Denied zeroes it. Adjust manually later if partial.
  const updateClaimStatus = useCallback((id, status) => {
    setClaims((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      let approvedAmount = c.approvedAmount;
      if ((status === 'Approved' || status === 'Paid') && !approvedAmount) approvedAmount = c.claimedAmount;
      if (status === 'Denied') approvedAmount = 0;
      return { ...c, status, approvedAmount };
    }));
  }, []);

  const deleteClaim = useCallback((id) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Online booking requests ───────────────────────────────────────────────
  const addBookingRequest = useCallback((data) => {
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
  }, []);

  // Confirming a request turns it into a real scheduled appointment. If it isn't
  // linked to an existing patient, a new patient record is created from it.
  // Built inline (not via addPatient/addAppointment) so names resolve without
  // waiting for the just-created patient to land in state.
  const confirmBookingRequest = useCallback((id, { dentistId, patientId } = {}) => {
    const req = bookingRequests.find((r) => r.id === id);
    if (!req) return;

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
    logAudit('Online Booking', 'Booking confirmed', `${pname} — ${req.service} on ${req.preferredDate} at ${req.preferredTime}`);
    return apptId;
  }, [bookingRequests, patients, dentists, logAudit]);

  const declineBookingRequest = useCallback((id) => {
    setBookingRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Declined' } : r)));
  }, []);

  // ── Memberships / in-house plans ──────────────────────────────────────────
  const addMembershipPlan = useCallback((data) => {
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
  }, []);

  const enrollMembership = useCallback((data) => {
    const patientObj = patients.find((p) => p.id === data.patientId);
    const plan = membershipPlans.find((p) => p.id === data.planId);
    const start = data.startDate || today();
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
    logAudit('Memberships', 'Patient enrolled', `${newMembership.patientName} — ${newMembership.planName}`);
    return newMembership;
  }, [patients, membershipPlans, logAudit]);

  const updateMembershipStatus = useCallback((id, status) => {
    setMemberships((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }, []);

  // Renew: extend the renewal date by one cycle from the later of (now, current
  // renewal) and reactivate.
  const renewMembership = useCallback((id) => {
    setMemberships((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const fromTime = Math.max(new Date(m.renewalDate || today()).getTime(), Date.now());
      return { ...m, renewalDate: addCycle(m.cycle || 'Annual', new Date(fromTime)), status: 'Active' };
    }));
  }, []);

  // ── Digital forms / e-consent ─────────────────────────────────────────────
  // Templates are a read-only constant in the Forms page; the page passes the
  // resolved templateName/category in `data` so the context stays lean.
  const assignForm = useCallback((data) => {
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
  }, [patients]);

  // Simulated e-signature: capture the typed signer name + date and complete.
  // Target resolved from closure (not inside the updater) so the audit entry
  // fires exactly once — updaters can be re-invoked by React.
  const completeForm = useCallback((id, signedBy) => {
    const target = formSubmissions.find((s) => s.id === id);
    setFormSubmissions((prev) => prev.map((s) =>
      s.id === id ? { ...s, status: 'Completed', completedDate: today(), signedBy: signedBy?.trim() || s.patientName, signatureDate: today() } : s
    ));
    if (target) logAudit('Forms', 'Form e-signed', `${target.templateName} signed by ${signedBy?.trim() || target.patientName}`);
  }, [formSubmissions, logAudit]);

  const deleteFormSubmission = useCallback((id) => {
    setFormSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Perio charting ────────────────────────────────────────────────────────
  const updatePerioTooth = useCallback((patientId, toothNumber, data) => {
    const num = Number(toothNumber);
    setPerioCharts((prev) => ({
      ...prev,
      [patientId]: {
        ...(prev[patientId] || {}),
        [num]: { depths: data.depths || [], bop: Boolean(data.bop), updatedAt: new Date().toISOString() },
      },
    }));
    logAudit('Clinical', 'Perio recorded', `Tooth ${num} — depths ${( data.depths || []).join('/')}${data.bop ? ', BOP' : ''}`);
  }, [logAudit]);

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
  // handler identity actually changes — not on every provider render.
  const value = useMemo(
    () => ({
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
      addPatient,
      updatePatient,
      addAppointment,
      updateAppointmentStatus,
      assignDentist,
      addTreatment,
      addPayment,
      getTodayAppointments,
      getTodayMetrics,
    }),
    [
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
      auditLog, logAudit, addPatient, updatePatient,
      addAppointment, updateAppointmentStatus, assignDentist, addTreatment,
      addPayment, getTodayAppointments, getTodayMetrics,
    ]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
