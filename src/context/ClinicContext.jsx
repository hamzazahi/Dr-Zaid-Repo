import { useEffect, useMemo, useState } from 'react';
import { ClinicContext } from './ClinicContextCore';
import {
  mockPatients,
  mockAppointments,
  mockTreatments,
  mockInvoices,
  mockPayments,
  mockDentists
} from '../utils/mockData';

const STORAGE_KEY = 'dental-clinic-app-data';

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
  const [invoices, setInvoices] = useState(() => stored.invoices || mockInvoices);
  const [payments, setPayments] = useState(() => stored.payments || mockPayments);
  const [dentists] = useState(mockDentists);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ patients, appointments, treatments, invoices, payments })
    );
  }, [patients, appointments, treatments, invoices, payments]);

  const addPatient = (patientData) => {
    const newPatient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      registrationDate: new Date().toISOString().split('T')[0],
      status: patientData.status || 'Active',
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  const updatePatient = (patientId, updates) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
    );
  };

  const addAppointment = (apptData) => {
    const patientObj = patients.find((p) => p.id === apptData.patientId);
    const dentistObj = dentists.find((d) => d.id === apptData.dentistId);
    const newAppt = {
      ...apptData,
      id: `appt-${Date.now()}`,
      patientName: patientObj?.name || 'Unknown Patient',
      dentistName: dentistObj?.name || 'Unknown Dentist',
      status: apptData.status || 'Scheduled',
    };
    setAppointments((prev) => [newAppt, ...prev]);
    return newAppt;
  };

  const updateAppointmentStatus = (apptId, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a))
    );
  };

  const assignDentist = (apptId, dentistId) => {
    const dentistObj = dentists.find((d) => d.id === dentistId);
    if (!dentistObj) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apptId ? { ...a, dentistId, dentistName: dentistObj.name } : a
      )
    );
  };

  const addTreatment = (treatmentData) => {
    const patientObj = patients.find((p) => p.id === treatmentData.patientId);
    const newTreatment = {
      ...treatmentData,
      id: `treat-${Date.now()}`,
      patientName: patientObj?.name || 'Unknown Patient',
      date: new Date().toISOString().split('T')[0],
      cost: Number(treatmentData.cost),
    };
    setTreatments((prev) => [newTreatment, ...prev]);

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 10);
    const invoiceNum = `INV-${today.getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      patientId: treatmentData.patientId,
      patientName: patientObj?.name || 'Unknown Patient',
      invoiceNumber: invoiceNum,
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      totalAmount: Number(treatmentData.cost),
      paidAmount: 0,
      balanceDue: Number(treatmentData.cost),
      status: 'Unpaid',
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    setPatients((prev) =>
      prev.map((p) =>
        p.id === treatmentData.patientId && p.status !== 'Pending Payment'
          ? { ...p, status: 'Pending Payment' }
          : p
      )
    );

    return newTreatment;
  };

  const addPayment = (paymentData) => {
    const newPayment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentData.amount),
    };
    setPayments((prev) => [newPayment, ...prev]);

    let targetPatientId = '';
    let invoiceFullyPaid = false;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== paymentData.invoiceId) return inv;
        targetPatientId = inv.patientId;
        const updatedPaid = inv.paidAmount + Number(paymentData.amount);
        const updatedBalance = Math.max(0, inv.totalAmount - updatedPaid);
        const updatedStatus = updatedBalance <= 0 ? 'Paid' : 'Partially Paid';
        if (updatedBalance <= 0) invoiceFullyPaid = true;
        return { ...inv, paidAmount: updatedPaid, balanceDue: updatedBalance, status: updatedStatus };
      })
    );

    if (invoiceFullyPaid && targetPatientId) {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id !== targetPatientId || p.status !== 'Pending Payment') return p;
          return { ...p, status: 'Active' };
        })
      );
    }

    return newPayment;
  };

  const getTodayAppointments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments.filter((a) => a.date === todayStr);
  };

  const getTodayMetrics = () => {
    const todayStr = new Date().toISOString().split('T')[0];
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
  };

  return (
    <ClinicContext.Provider
      value={{
        patients,
        appointments,
        treatments,
        invoices,
        payments,
        dentists,
        addPatient,
        updatePatient,
        addAppointment,
        updateAppointmentStatus,
        assignDentist,
        addTreatment,
        addPayment,
        getTodayAppointments,
        getTodayMetrics,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};
