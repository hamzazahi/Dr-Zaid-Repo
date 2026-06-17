import { useEffect, useState } from 'react';
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

const readStoredClinicData = () => {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const ClinicProvider = ({ children }) => {
  const [storedClinicData] = useState(() => readStoredClinicData());
  const [patients, setPatients] = useState(() => storedClinicData.patients || mockPatients);
  const [appointments, setAppointments] = useState(() => storedClinicData.appointments || mockAppointments);
  const [treatments, setTreatments] = useState(() => storedClinicData.treatments || mockTreatments);
  const [invoices, setInvoices] = useState(() => storedClinicData.invoices || mockInvoices);
  const [payments, setPayments] = useState(() => storedClinicData.payments || mockPayments);
  const [dentists] = useState(mockDentists);

  useEffect(() => {
    const clinicData = {
      patients,
      appointments,
      treatments,
      invoices,
      payments
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clinicData));
  }, [appointments, invoices, patients, payments, treatments]);

  // Stateful Modifiers
  const addPatient = (patientData) => {
    const newPatient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      registrationDate: new Date().toISOString().split('T')[0],
      status: patientData.status || 'Active'
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  const addAppointment = (apptData) => {
    const patientObj = patients.find(p => p.id === apptData.patientId);
    const dentistObj = dentists.find(d => d.id === apptData.dentistId);

    const newAppt = {
      ...apptData,
      id: `appt-${Date.now()}`,
      patientName: patientObj ? patientObj.name : 'Unknown Patient',
      dentistName: dentistObj ? dentistObj.name : 'Unknown Dentist',
      status: apptData.status || 'Scheduled'
    };
    setAppointments((prev) => [newAppt, ...prev]);
    return newAppt;
  };

  const updateAppointmentStatus = (apptId, status) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === apptId ? { ...appt, status } : appt))
    );
  };

  const assignDentist = (apptId, dentistId) => {
    const dentistObj = dentists.find(d => d.id === dentistId);
    if (!dentistObj) return;
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === apptId
          ? { ...appt, dentistId, dentistName: dentistObj.name }
          : appt
      )
    );
  };

  const addTreatment = (treatmentData) => {
    const patientObj = patients.find(p => p.id === treatmentData.patientId);
    const newTreatment = {
      ...treatmentData,
      id: `treat-${Date.now()}`,
      patientName: patientObj ? patientObj.name : 'Unknown Patient',
      date: new Date().toISOString().split('T')[0],
      cost: Number(treatmentData.cost)
    };

    // 1. Add to treatments list
    setTreatments((prev) => [newTreatment, ...prev]);

    // 2. Automatically generate an Invoice for this treatment
    const invoiceNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 10); // Due in 10 days

    const newInvoice = {
      id: `inv-${Date.now()}`,
      patientId: treatmentData.patientId,
      patientName: patientObj ? patientObj.name : 'Unknown Patient',
      invoiceNumber: invoiceNum,
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      totalAmount: Number(treatmentData.cost),
      paidAmount: 0,
      balanceDue: Number(treatmentData.cost),
      status: 'Unpaid'
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // 3. Mark patient status as Pending Payment if they aren't already
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
      amount: Number(paymentData.amount)
    };

    // 1. Add to payments list
    setPayments((prev) => [newPayment, ...prev]);

    // 2. Update Invoice
    let targetPatientId = '';
    setInvoices((prevInvoices) => {
      return prevInvoices.map((inv) => {
        if (inv.id === paymentData.invoiceId) {
          targetPatientId = inv.patientId;
          const updatedPaidAmount = inv.paidAmount + Number(paymentData.amount);
          const updatedBalanceDue = Math.max(0, inv.totalAmount - updatedPaidAmount);
          const updatedStatus = updatedBalanceDue <= 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            paidAmount: updatedPaidAmount,
            balanceDue: updatedBalanceDue,
            status: updatedStatus
          };
        }
        return inv;
      });
    });

    // 3. Re-evaluate Patient Status: If patient has zero outstanding balance, mark status as Active
    setTimeout(() => {
      if (!targetPatientId) return;
      setInvoices((currentInvoices) => {
        const patientInvs = currentInvoices.filter(i => i.patientId === targetPatientId);
        const hasBalance = patientInvs.some(i => i.balanceDue > 0);
        if (!hasBalance) {
          setPatients((currentPatients) =>
            currentPatients.map((p) =>
              p.id === targetPatientId && p.status === 'Pending Payment'
                ? { ...p, status: 'Active' }
                : p
            )
          );
        }
        return currentInvoices;
      });
    }, 50);

    return newPayment;
  };

  // Helper selectors
  const getTodayAppointments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments.filter((appt) => appt.date === todayStr);
  };

  const getTodayMetrics = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments
    const todayAppts = appointments.filter((a) => a.date === todayStr);

    // Completed Treatments Today
    const completedTreatments = treatments.filter((t) => t.date === todayStr);

    // Revenue Collected Today (sum of payments received today)
    const revenueToday = payments
      .filter((p) => p.date === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);

    // Total Outstanding / Pending Payments across all unpaid invoices
    const totalPendingPayments = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    // Total Patients seen or registered today
    const totalPatientsToday = new Set([
      ...todayAppts.map(a => a.patientId),
      ...completedTreatments.map(t => t.patientId)
    ]).size;

    return {
      totalPatientsToday,
      appointmentsTodayCount: todayAppts.length,
      completedTreatmentsCount: completedTreatments.length,
      revenueToday,
      totalPendingPayments
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
        addAppointment,
        updateAppointmentStatus,
        assignDentist,
        addTreatment,
        addPayment,
        getTodayAppointments,
        getTodayMetrics
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};
