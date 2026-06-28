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
  mockRecalls
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
        })
      );
    } catch {
      // Storage full or unavailable (e.g. private mode). The app keeps working
      // from in-memory state; we just can't persist this change.
    }
  }, [patients, appointments, treatments, invoices, payments, toothRecords, toothHistory, prescriptions, treatmentPlans, staff, labCases, recalls]);

  const addPatient = useCallback((patientData) => {
    const newPatient = {
      ...patientData,
      id: uid('pat'),
      registrationDate: today(),
      status: patientData.status || 'Active',
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  }, []);

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
    return newAppt;
  }, [patients, dentists]);

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

    return newTreatment;
  }, [patients]);

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

    return newPayment;
  }, [invoices]);

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

    return record;
  }, []);

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
    return newPx;
  }, [patients, dentists]);

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
      return;
    }

    setTreatmentPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status } : p)));
  }, [treatmentPlans]);

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
      labCases, addLabCase, updateLabCaseStatus, addPatient, updatePatient,
      addAppointment, updateAppointmentStatus, assignDentist, addTreatment,
      addPayment, getTodayAppointments, getTodayMetrics,
    ]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
