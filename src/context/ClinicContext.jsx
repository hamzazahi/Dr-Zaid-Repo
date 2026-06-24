import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClinicContext } from './ClinicContextCore';
import {
  mockPatients,
  mockAppointments,
  mockTreatments,
  mockInvoices,
  mockPayments,
  mockDentists
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
  const [dentists] = useState(mockDentists);

  // Dental charting (odontogram) state.
  // toothRecords: { [patientId]: { [toothNumber]: { status, surfaces, notes, updatedAt } } }
  // toothHistory: append-only audit log of every charting change (capped).
  const [toothRecords, setToothRecords] = useState(() => stored.toothRecords || {});
  const [toothHistory, setToothHistory] = useState(() => stored.toothHistory || []);

  // Prescriptions (persisted, with an active ↔ completed lifecycle).
  const [prescriptions, setPrescriptions] = useState(() => stored.prescriptions || []);

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
        })
      );
    } catch {
      // Storage full or unavailable (e.g. private mode). The app keeps working
      // from in-memory state; we just can't persist this change.
    }
  }, [patients, appointments, treatments, invoices, payments, toothRecords, toothHistory, prescriptions]);

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
      updatePrescriptionStatus, addPatient, updatePatient,
      addAppointment, updateAppointmentStatus, assignDentist, addTreatment,
      addPayment, getTodayAppointments, getTodayMetrics,
    ]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};
