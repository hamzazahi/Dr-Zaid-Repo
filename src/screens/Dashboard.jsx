import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Users, Calendar, AlertTriangle, CreditCard, PlusCircle, CalendarPlus, Receipt, ChevronRight } from 'lucide-react';

export default function Dashboard({ setActiveTab, setSelectedPatientId }) {
  const { 
    patients, 
    appointments, 
    invoices, 
    patientLedger, 
    getTodayAppointments, 
    getOverdueInvoices 
  } = useDatabase();

  const todayAppts = getTodayAppointments();
  const overdueInvs = getOverdueInvoices();

  // Metrics
  const totalPatients = patients.length;
  const activeApptsCount = appointments.filter(a => a.Status === 'Scheduled' || a.Status === 'Confirmed').length;
  
  // Running ledger outstanding balance across all patients
  const totalOutstanding = patientLedger.reduce((sum, item) => sum + (Number(item.Debit) - Number(item.Credit)), 0);
  
  // Monthly Revenue (Paid Amount on invoices this month)
  const monthlyRevenue = invoices
    .filter(inv => inv.Status === 'Paid' || inv.Status === 'Partially Paid')
    .reduce((sum, inv) => sum + Number(inv.PaidAmount), 0);

  const handlePatientClick = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Clinical Dashboard</h1>
          <p className="text-sm text-muted">Welcome to Dental Clinic Management System. Here is today's overview.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="p-3 rounded-lg bg-teal-500 bg-opacity-10 text-teal-500">
            <Users size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Total Registered Patients</div>
            <div className="text-xl font-bold mt-1">{totalPatients}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="p-3 rounded-lg bg-blue-500 bg-opacity-10 text-blue-500">
            <Calendar size={24} style={{ color: 'var(--color-info)' }} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Today's Appointments</div>
            <div className="text-xl font-bold mt-1">{todayAppts.length}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="p-3 rounded-lg bg-amber-500 bg-opacity-10 text-amber-500">
            <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Outstanding Balances</div>
            <div className="text-xl font-bold mt-1 text-yellow-500">${totalOutstanding.toFixed(2)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="p-3 rounded-lg bg-emerald-500 bg-opacity-10 text-emerald-500">
            <CreditCard size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Total Revenue Collected</div>
            <div className="text-xl font-bold mt-1 text-green-500">${monthlyRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="glass-panel">
        <h3 className="text-sm font-semibold mb-3 text-secondary">Quick Shortcuts</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary" onClick={() => handlePatientClick('new')}>
            <PlusCircle size={16} /> Register Patient
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('scheduler')}>
            <CalendarPlus size={16} /> Book Appointment
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('billing')}>
            <Receipt size={16} /> Add Billing Invoice
          </button>
        </div>
      </div>

      {/* Main Grid: Today's Schedule and Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 glass-panel flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold">Today's Appointments Schedule</h3>
            <span className="badge badge-info">{todayAppts.length} Scheduled</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {todayAppts.length === 0 ? (
              <div className="p-6 text-center text-muted">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                No appointments scheduled for today.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Dentist</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map(appt => {
                    const time = new Date(appt.AppointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={appt.AppointmentId}>
                        <td className="font-semibold">{time}</td>
                        <td 
                          className="font-bold text-primary cursor-pointer hover:underline"
                          onClick={() => handlePatientClick(appt.PatientId)}
                        >
                          {appt.PatientName}
                        </td>
                        <td>{appt.DentistName}</td>
                        <td className="text-muted">{appt.AppointmentType}</td>
                        <td>
                          <span className={`badge badge-${
                            appt.Status === 'Completed' ? 'success' :
                            appt.Status === 'Confirmed' ? 'info' :
                            appt.Status === 'Cancelled' ? 'danger' : 'warning'
                          }`}>
                            {appt.Status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handlePatientClick(appt.PatientId)}
                          >
                            Profile <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="glass-panel flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Overdue Invoices
            </h3>
            <span className="badge badge-danger">{overdueInvs.length} Overdue</span>
          </div>

          <div className="flex flex-col gap-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {overdueInvs.length === 0 ? (
              <div className="p-6 text-center text-muted">
                No overdue invoices. Outstanding balances are up to date!
              </div>
            ) : (
              overdueInvs.map(inv => (
                <div 
                  key={inv.InvoiceId} 
                  className="p-3 rounded-lg bg-opacity-20 border flex flex-col gap-2 cursor-pointer hover:bg-opacity-30 transition-all"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handlePatientClick(inv.PatientId)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-muted">{inv.InvoiceNumber}</span>
                    <span className="text-xs text-red-500 font-bold">{inv.DaysOverdue} Days Overdue</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{inv.PatientName}</span>
                    <span className="font-bold text-sm text-red-500">${inv.BalanceDue.toFixed(2)}</span>
                  </div>

                  <div className="text-xxs text-muted">
                    Due Date: {new Date(inv.DueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
