import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Search, UserPlus, Heart, Calendar, FileText, DollarSign, Pill, Plus, Printer, ShieldAlert, Award, Activity } from 'lucide-react';
import DentalChart from '../components/DentalChart';

export default function Patients({ selectedPatientId, setSelectedPatientId }) {
  const { 
    patients, 
    registerPatient, 
    appointments, 
    treatmentPlans, 
    treatmentPlanItems, 
    invoices, 
    payments, 
    patientLedger, 
    prescriptions, 
    prescriptionItems,
    procedures, 
    createTreatmentPlan,
    updateTreatmentPlanStatus,
    createInvoice, 
    createPrescription, 
    printPrescription,
    currentUser,
    users,
    getPatientLedgerSummary
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chart');
  
  // Registration Form State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('M');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [medHistory, setMedHistory] = useState('');
  const [emergContact, setEmergContact] = useState('');
  const [emergPhone, setEmergPhone] = useState('');
  const [referredBy, setReferredBy] = useState('');

  // Treatment Plan Builder State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [planItems, setPlanItems] = useState([{ ProcedureId: '', ToothRecordId: '', Notes: '', Priority: 2 }]);

  // Prescription Builder State
  const [showRxModal, setShowRxModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxItems, setRxItems] = useState([{ MedicineName: '', GenericName: '', Dosage: '', Frequency: '', Duration: '', Route: 'Oral', Quantity: 1 }]);

  // Active Patient computed summary
  const activePatient = patients.find(p => p.PatientId === Number(selectedPatientId));

  useEffect(() => {
    if (selectedPatientId === 'new') {
      setShowRegisterModal(true);
      setSelectedPatientId(null);
    }
  }, [selectedPatientId]);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const newPat = registerPatient({
      FirstName: firstName,
      LastName: lastName,
      DateOfBirth: dob,
      Gender: gender,
      Phone: phone,
      Email: email,
      Address: address,
      City: city,
      BloodGroup: bloodGroup,
      Allergies: allergies,
      MedicalHistory: medHistory,
      EmergencyContact: emergContact,
      EmergencyPhone: emergPhone,
      ReferredBy: referredBy
    });

    // Reset Form
    setFirstName('');
    setLastName('');
    setDob('');
    setGender('M');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setAllergies('');
    setMedHistory('');
    setEmergContact('');
    setEmergPhone('');
    setReferredBy('');
    
    setShowRegisterModal(false);
    setSelectedPatientId(newPat.PatientId);
  };

  // Treatment Plan Submission
  const handleAddPlanItem = () => {
    setPlanItems(prev => [...prev, { ProcedureId: '', ToothRecordId: '', Notes: '', Priority: 2 }]);
  };

  const handleRemovePlanItem = (idx) => {
    setPlanItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePlanItemChange = (idx, field, value) => {
    setPlanItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreatePlanSubmit = (e) => {
    e.preventDefault();
    if (!planName || planItems.some(it => !it.ProcedureId)) {
      alert("Please enter a plan name and select procedures.");
      return;
    }

    const itemsToCreate = planItems.map(it => {
      const proc = procedures.find(p => p.ProcedureId === Number(it.ProcedureId));
      return {
        ProcedureId: proc.ProcedureId,
        ToothRecordId: it.ToothRecordId ? Number(it.ToothRecordId) : null,
        EstimatedCost: proc.DefaultCost,
        Priority: Number(it.Priority),
        Notes: it.Notes
      };
    });

    createTreatmentPlan(activePatient.PatientId, planName, itemsToCreate, planNotes);

    setPlanName('');
    setPlanNotes('');
    setPlanItems([{ ProcedureId: '', ToothRecordId: '', Notes: '', Priority: 2 }]);
    setShowPlanModal(false);
  };

  // Prescription Submission
  const handleAddRxItem = () => {
    setRxItems(prev => [...prev, { MedicineName: '', GenericName: '', Dosage: '', Frequency: '', Duration: '', Route: 'Oral', Quantity: 1 }]);
  };

  const handleRemoveRxItem = (idx) => {
    setRxItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRxItemChange = (idx, field, value) => {
    setRxItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreateRxSubmit = (e) => {
    e.preventDefault();
    if (rxItems.some(it => !it.MedicineName || !it.Dosage)) {
      alert("Please specify a medicine name and dosage instructions.");
      return;
    }

    createPrescription(activePatient.PatientId, null, diagnosis, rxNotes, rxItems);

    setDiagnosis('');
    setRxNotes('');
    setRxItems([{ MedicineName: '', GenericName: '', Dosage: '', Frequency: '', Duration: '', Route: 'Oral', Quantity: 1 }]);
    setShowRxModal(false);
  };

  // Convert Treatment Plan to Invoice
  const handleInvoicedPlan = (plan) => {
    const planItemsList = treatmentPlanItems.filter(it => it.TreatmentPlanId === plan.TreatmentPlanId);
    if (planItemsList.length === 0) {
      alert("No items in this plan to invoice.");
      return;
    }

    const finalInvoiceItems = planItemsList.map(item => {
      const proc = procedures.find(p => p.ProcedureId === item.ProcedureId);
      return {
        ProcedureId: item.ProcedureId,
        ToothNumber: null, // Custom charting linkage
        Description: `${proc.ProcedureName} (${proc.ProcedureCode}) - Plan Item`,
        Quantity: 1,
        UnitPrice: item.EstimatedCost,
        DiscountPct: 0
      };
    });

    createInvoice(activePatient.PatientId, plan.TreatmentPlanId, null, finalInvoiceItems);
    updateTreatmentPlanStatus(plan.TreatmentPlanId, 'In Progress');
    alert("Invoice generated and Patient Ledger updated successfully!");
  };

  // Filter patients by search query
  const filteredPatients = patients.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.FirstName.toLowerCase().includes(query) ||
      p.LastName.toLowerCase().includes(query) ||
      p.MRN.toLowerCase().includes(query) ||
      p.Phone.includes(query)
    );
  });

  // Derived patient summary clinical logs
  const activeAppointments = appointments.filter(a => a.PatientId === activePatient?.PatientId).sort((a,b) => b.AppointmentDate.localeCompare(a.AppointmentDate));
  const activePlans = treatmentPlans.filter(p => p.PatientId === activePatient?.PatientId).sort((a,b) => b.CreatedAt.localeCompare(a.CreatedAt));
  const activeInvoices = invoices.filter(i => i.PatientId === activePatient?.PatientId).sort((a,b) => b.InvoiceDate.localeCompare(a.InvoiceDate));
  const activeLedger = patientLedger.filter(l => l.PatientId === activePatient?.PatientId).sort((a,b) => b.CreatedAt.localeCompare(a.CreatedAt));
  const activePrescriptions = prescriptions.filter(p => p.PatientId === activePatient?.PatientId).sort((a,b) => b.PrescriptionDate.localeCompare(a.PrescriptionDate));
  const ledgerSummary = activePatient ? getPatientLedgerSummary(activePatient.PatientId) : null;

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade">
      {/* Search Header / Directory */}
      {!activePatient ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Patient Directory</h1>
              <p className="text-sm text-muted">Register, manage profiles, record treatments, and review outstanding accounts.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)}>
              <UserPlus size={16} /> Register Patient
            </button>
          </div>

          <div className="glass-panel flex items-center gap-3">
            <Search size={20} className="text-muted" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Patient MRN, First/Last Name, or Mobile Phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="glass-panel">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Medical Record No (MRN)</th>
                  <th>Patient Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Mobile Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center p-8 text-muted">
                      No patients registered matching search parameters.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(p => {
                    const outstanding = getPatientLedgerSummary(p.PatientId).OutstandingBalance;
                    return (
                      <tr key={p.PatientId}>
                        <td className="font-semibold text-xs text-muted">{p.MRN}</td>
                        <td className="font-bold text-primary">{p.FirstName} {p.LastName}</td>
                        <td>{p.DateOfBirth}</td>
                        <td>{p.Gender}</td>
                        <td>{p.Phone}</td>
                        <td className="text-muted">{p.Email || '-'}</td>
                        <td>{p.City || '-'}</td>
                        <td>
                          {outstanding > 0 ? (
                            <span className="badge badge-warning">Owe ${outstanding.toFixed(2)}</span>
                          ) : (
                            <span className="badge badge-success">Clear</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => setSelectedPatientId(p.PatientId)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Open File
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Patient Profile Workspace */
        <div className="flex flex-col gap-6 animate-fade">
          {/* Breadcrumb Info Bar */}
          <div className="flex justify-between items-start border-b border-color pb-4">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-teal-500 bg-opacity-10 text-teal-400 rounded-full">
                <Heart size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {activePatient.FirstName} {activePatient.LastName}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sidebar border border-color text-muted">{activePatient.MRN}</span>
                </h1>
                <div className="flex gap-4 text-xs text-muted mt-1">
                  <span>DOB: <strong>{activePatient.DateOfBirth}</strong></span>
                  <span>Gender: <strong>{activePatient.Gender}</strong></span>
                  <span>Phone: <strong>{activePatient.Phone}</strong></span>
                  <span>Blood: <strong className="text-red-400">{activePatient.BloodGroup || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-xxs text-muted font-bold uppercase">Patient Balance</div>
                <div className={`text-lg font-extrabold ${ledgerSummary.OutstandingBalance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                  ${ledgerSummary.OutstandingBalance.toFixed(2)}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedPatientId(null)}>
                Back to Directory
              </button>
            </div>
          </div>

          {/* Quick Warnings / Allergies Banner */}
          {(activePatient.Allergies || activePatient.MedicalHistory) && (
            <div className="flex gap-4 p-3 rounded-lg border bg-opacity-20" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <ShieldAlert className="text-red-500 flex-shrink-0" />
              <div className="text-xs">
                {activePatient.Allergies && (
                  <div><strong className="text-red-400">Allergies:</strong> {activePatient.Allergies}</div>
                )}
                {activePatient.MedicalHistory && (
                  <div className="mt-1"><strong className="text-red-400">Alert Medical History:</strong> {activePatient.MedicalHistory}</div>
                )}
              </div>
            </div>
          )}

          {/* Clinical Work Tabs */}
          <div className="flex border-b border-color gap-1 bg-sidebar p-1 rounded-lg">
            {[
              { id: 'chart', name: 'Clinical Charting', icon: Activity },
              { id: 'appts', name: 'Appointments Log', icon: Calendar },
              { id: 'plans', name: 'Treatment Planning', icon: FileText },
              { id: 'billing', name: 'Billing Ledger', icon: DollarSign },
              { id: 'rx', name: 'Prescriptions (Rx)', icon: Pill },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`btn flex-1 flex gap-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', borderRadius: '6px', fontSize: '13px' }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} /> {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Workspaces */}
          <div className="glass-panel">
            {/* Charting Tab */}
            {activeTab === 'chart' && (
              <DentalChart patientId={activePatient.PatientId} />
            )}

            {/* Appointments Tab */}
            {activeTab === 'appts' && (
              <div>
                <h3 className="text-base font-bold mb-4">Patient Appointment Log</h3>
                {activeAppointments.length === 0 ? (
                  <p className="text-muted text-center p-6">No historical appointments scheduled for this patient.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeAppointments.map(appt => {
                      const dentist = users.find(u => u.UserId === appt.DentistUserId);
                      return (
                        <div key={appt.AppointmentId} className="p-4 rounded-lg bg-sidebar border border-color flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-primary">
                              {new Date(appt.AppointmentDate).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              Dentist: <strong>Dr. {dentist ? `${dentist.FirstName} ${dentist.LastName}` : 'Unassigned'}</strong>
                            </div>
                            <div className="text-xs mt-2 text-muted">
                              Type: <strong className="text-primary">{appt.AppointmentType}</strong>
                            </div>
                            {appt.ChiefComplaint && (
                              <div className="text-xs text-muted mt-2">
                                Chief Complaint: <em>"{appt.ChiefComplaint}"</em>
                              </div>
                            )}
                            {appt.ClinicalNotes && (
                              <div className="mt-3 p-3 bg-app border border-color rounded text-xs text-muted">
                                <strong>Clinical Assessment Notes:</strong>
                                <p className="mt-1 leading-relaxed text-secondary">{appt.ClinicalNotes}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-right flex flex-col gap-2 items-end">
                            <span className={`badge badge-${
                              appt.Status === 'Completed' ? 'success' :
                              appt.Status === 'Confirmed' ? 'info' :
                              appt.Status === 'Cancelled' ? 'danger' : 'warning'
                            }`}>
                              {appt.Status}
                            </span>
                            {appt.CancellationReason && (
                              <span className="text-xxs text-red-400">Reason: {appt.CancellationReason}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Treatment Planning Tab */}
            {activeTab === 'plans' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold">Clinical Treatment Plans</h3>
                  <button className="btn btn-primary" onClick={() => setShowPlanModal(true)}>
                    + Create Treatment Plan
                  </button>
                </div>

                {activePlans.length === 0 ? (
                  <p className="text-muted text-center p-6">No treatment plans proposed yet.</p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {activePlans.map(plan => {
                      const items = treatmentPlanItems.filter(it => it.TreatmentPlanId === plan.TreatmentPlanId);
                      return (
                        <div key={plan.TreatmentPlanId} className="p-4 rounded-lg bg-sidebar border border-color flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-primary">{plan.PlanName}</h4>
                              <div className="text-xs text-muted mt-1">Proposed Date: {new Date(plan.CreatedAt).toLocaleDateString()}</div>
                              {plan.Notes && <p className="text-xs text-muted mt-2">Notes: {plan.Notes}</p>}
                            </div>

                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex gap-2">
                                <span className={`badge ${plan.Status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                                  {plan.Status}
                                </span>
                                {plan.Status === 'Draft' && (
                                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleInvoicedPlan(plan)}>
                                    Approve & Invoice
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-muted mt-1">Est. Total: <strong>${plan.TotalEstimatedCost.toFixed(2)}</strong></span>
                            </div>
                          </div>

                          {/* Plan Line Items */}
                          <div className="border border-color rounded overflow-hidden">
                            <table className="custom-table" style={{ fontSize: '12px' }}>
                              <thead>
                                <tr style={{ background: 'var(--bg-app)' }}>
                                  <th>Priority</th>
                                  <th>Tooth #</th>
                                  <th>Procedure</th>
                                  <th>Estimated Cost</th>
                                  <th>Notes</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map(item => {
                                  const proc = procedures.find(p => p.ProcedureId === item.ProcedureId);
                                  return (
                                    <tr key={item.PlanItemId}>
                                      <td>{item.Priority === 1 ? 'High' : item.Priority === 3 ? 'Low' : 'Medium'}</td>
                                      <td className="font-semibold text-primary">{item.ToothRecordId ? `Tooth #${item.ToothRecordId % 32 || 32}` : 'Global'}</td>
                                      <td>{proc ? `${proc.ProcedureCode} - ${proc.ProcedureName}` : 'Unknown'}</td>
                                      <td>${item.EstimatedCost.toFixed(2)}</td>
                                      <td className="text-muted">{item.Notes || '-'}</td>
                                      <td>
                                        <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)' }}>
                                          {item.Status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Invoices & Double Entry Ledger Tab */}
            {activeTab === 'billing' && (
              <div className="flex flex-col gap-6">
                {/* Ledger section */}
                <div>
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                    <Award size={18} className="text-teal-400" /> Patient Financial Ledger (Double-Entry Audit)
                  </h3>
                  
                  <table className="custom-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-sidebar)' }}>
                        <th>Date</th>
                        <th>Transaction Detail</th>
                        <th>Debit (Charge)</th>
                        <th>Credit (Payment)</th>
                        <th>Running Balance</th>
                        <th>Authorized By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLedger.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4 text-muted">No journal entry posted yet.</td>
                        </tr>
                      ) : (
                        activeLedger.map(entry => {
                          const staff = users.find(u => u.UserId === entry.CreatedByUserId);
                          return (
                            <tr key={entry.LedgerEntryId}>
                              <td>{entry.EntryDate}</td>
                              <td className="font-semibold text-primary">{entry.Description}</td>
                              <td className={entry.Debit > 0 ? "text-yellow-500 font-bold" : "text-muted"}>
                                {entry.Debit > 0 ? `$${entry.Debit.toFixed(2)}` : '-'}
                              </td>
                              <td className={entry.Credit > 0 ? "text-green-500 font-bold" : "text-muted"}>
                                {entry.Credit > 0 ? `$${entry.Credit.toFixed(2)}` : '-'}
                              </td>
                              <td className="font-bold">${entry.RunningBalance.toFixed(2)}</td>
                              <td>{staff ? staff.Username : 'System'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Invoices list */}
                <div className="border-t border-color pt-6">
                  <h3 className="text-base font-bold mb-3">Invoice Journal</h3>
                  <table className="custom-table" style={{ fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Balance Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-4 text-muted">No billing invoices issued.</td>
                        </tr>
                      ) : (
                        activeInvoices.map(inv => (
                          <tr key={inv.InvoiceId}>
                            <td className="font-semibold">{inv.InvoiceNumber}</td>
                            <td>{inv.InvoiceDate}</td>
                            <td>${inv.TotalAmount.toFixed(2)}</td>
                            <td className="text-green-500">${inv.PaidAmount.toFixed(2)}</td>
                            <td className="text-yellow-500 font-bold">${inv.BalanceDue.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${
                                inv.Status === 'Paid' ? 'badge-success' :
                                inv.Status === 'Partially Paid' ? 'badge-info' : 'badge-warning'
                              }`}>
                                {inv.Status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'rx' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold">Clinical Prescriptions (Rx)</h3>
                  <button className="btn btn-primary" onClick={() => setShowRxModal(true)}>
                    + New Prescription
                  </button>
                </div>

                {activePrescriptions.length === 0 ? (
                  <p className="text-muted text-center p-6">No pharmaceutical prescriptions issued yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {activePrescriptions.map(rx => {
                      const items = prescriptionItems.filter(it => it.PrescriptionId === rx.PrescriptionId);
                      const dentist = users.find(u => u.UserId === rx.DentistUserId);
                      return (
                        <div key={rx.PrescriptionId} className="p-4 rounded-lg bg-sidebar border border-color flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center">
                              <span className="font-bold text-sm text-primary">Rx Date: {rx.PrescriptionDate}</span>
                              <span className="text-xxs px-2 py-0.5 rounded border border-color text-muted">
                                Issuer: Dr. {dentist ? dentist.LastName : 'Jane Doe'}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-teal-400 mt-2">Diagnosis: {rx.Diagnosis || 'Dental condition'}</div>
                            
                            {/* Prescription Items Grid */}
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {items.map(item => (
                                <div key={item.PrescriptionItemId} className="p-2 rounded bg-app border border-color text-xs">
                                  <div className="font-bold text-primary">{item.MedicineName} {item.GenericName && `(${item.GenericName})`}</div>
                                  <div className="text-muted mt-1">
                                    Dosage: <strong>{item.Dosage}</strong> | Route: <strong>{item.Route}</strong>
                                  </div>
                                  <div className="text-muted">
                                    Frequency: <strong>{item.Frequency}</strong> | Duration: <strong>{item.Duration}</strong>
                                  </div>
                                  {item.Instructions && <div className="text-teal-500 mt-0.5">Note: {item.Instructions}</div>}
                                  <div className="text-right text-xxs font-bold text-primary mt-1">QTY: {item.Quantity}</div>
                                </div>
                              ))}
                            </div>
                            
                            {rx.Notes && (
                              <p className="text-xs text-muted mt-3 italic">Clinical Instructions: {rx.Notes}</p>
                            )}
                          </div>

                          <div>
                            <button className="btn btn-secondary flex items-center gap-1 text-xs" onClick={() => alert(`Printing RX #${rx.PrescriptionId}...\n\nDentist License: CLIN-8938\nPatient: ${activePatient.FirstName} ${activePatient.LastName}\nDrugs: ${items.map(it => `\n- ${it.MedicineName} Qty:${it.Quantity}`).join('')}`)}>
                              <Printer size={12} /> Print Rx
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Registration Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleRegisterSubmit} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Register New Patient</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowRegisterModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>
            
            <div className="modal-body grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Last Name *</label>
                <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Date of Birth *</label>
                <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Gender *</label>
                <select className="form-select" value={gender} onChange={e => setGender(e.target.value)} required>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Mobile Phone *</label>
                <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="col-span-2">
                <label className="form-label">Home Address</label>
                <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div>
                <label className="form-label">City</label>
                <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="form-label text-red-400">Allergies (Penicillin, etc.)</label>
                <input type="text" className="form-input" placeholder="List any allergies..." value={allergies} onChange={e => setAllergies(e.target.value)} />
              </div>

              <div className="col-span-2">
                <label className="form-label text-yellow-500">Medical History</label>
                <textarea className="form-textarea" rows="2" placeholder="e.g. Asthma, High Blood Pressure, Heart surgery..." value={medHistory} onChange={e => setMedHistory(e.target.value)}></textarea>
              </div>

              <div>
                <label className="form-label">Emergency Contact Name</label>
                <input type="text" className="form-input" value={emergContact} onChange={e => setEmergContact(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Emergency Phone</label>
                <input type="text" className="form-input" value={emergPhone} onChange={e => setEmergPhone(e.target.value)} />
              </div>

              <div className="col-span-2">
                <label className="form-label">Referred By</label>
                <input type="text" className="form-input" placeholder="Google, Doctor referral name..." value={referredBy} onChange={e => setReferredBy(e.target.value)} />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Medical Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Creation Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleCreatePlanSubmit} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Propose Clinical Treatment Plan</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowPlanModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>

            <div className="modal-body flex flex-col gap-4">
              <div>
                <label className="form-label">Plan Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Wisdom Tooth Extraction Plan" value={planName} onChange={e => setPlanName(e.target.value)} required />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Plan Items</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddPlanItem}>
                    + Add Procedure
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {planItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-sidebar p-3 rounded-lg border border-color">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <select 
                            className="form-select text-xs" 
                            value={item.ProcedureId} 
                            onChange={e => handlePlanItemChange(idx, 'ProcedureId', e.target.value)}
                            required
                          >
                            <option value="">-- Choose Procedure Code --</option>
                            {procedures.map(p => (
                              <option key={p.ProcedureId} value={p.ProcedureId}>{p.ProcedureCode} - {p.ProcedureName} (${p.DefaultCost})</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ width: '110px' }}>
                          <input 
                            type="number" 
                            className="form-input text-xs" 
                            placeholder="Tooth # (Opt)" 
                            min="1" 
                            max="32" 
                            value={item.ToothRecordId} 
                            onChange={e => handlePlanItemChange(idx, 'ToothRecordId', e.target.value)} 
                          />
                        </div>

                        <div style={{ width: '110px' }}>
                          <select 
                            className="form-select text-xs" 
                            value={item.Priority} 
                            onChange={e => handlePlanItemChange(idx, 'Priority', e.target.value)}
                          >
                            <option value="1">High</option>
                            <option value="2">Medium</option>
                            <option value="3">Low</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Add item details or tooth surfaces..." 
                            value={item.Notes} 
                            onChange={e => handlePlanItemChange(idx, 'Notes', e.target.value)} 
                          />
                        </div>

                        {planItems.length > 1 && (
                          <button type="button" className="btn btn-danger text-xs" style={{ padding: '6px 12px' }} onClick={() => handleRemovePlanItem(idx)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Clinical Plan Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Prognosis details, recommended anesthesia, etc."
                  value={planNotes}
                  onChange={e => setPlanNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Draft Plan</button>
            </div>
          </form>
        </div>
      )}

      {/* Prescription Creation Modal */}
      {showRxModal && (
        <div className="modal-overlay" onClick={() => setShowRxModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleCreateRxSubmit} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Write Clinical Prescription</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowRxModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>

            <div className="modal-body flex flex-col gap-4">
              <div>
                <label className="form-label">Diagnosis *</label>
                <input type="text" className="form-input" placeholder="e.g. Abscess, Post-op pain, Pulpitis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Prescription Drugs</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddRxItem}>
                    + Add Medication
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {rxItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-sidebar p-3 rounded-lg border border-color">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Medicine Name * (e.g. Amoxicillin)" 
                            value={item.MedicineName} 
                            onChange={e => handleRxItemChange(idx, 'MedicineName', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Generic Name" 
                            value={item.GenericName} 
                            onChange={e => handleRxItemChange(idx, 'GenericName', e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div>
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Dosage * (e.g. 500mg)" 
                            value={item.Dosage} 
                            onChange={e => handleRxItemChange(idx, 'Dosage', e.target.value)} 
                            required 
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Frequency * (e.g. BD/TDS)" 
                            value={item.Frequency} 
                            onChange={e => handleRxItemChange(idx, 'Frequency', e.target.value)} 
                            required 
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            className="form-input text-xs" 
                            placeholder="Duration * (e.g. 5 days)" 
                            value={item.Duration} 
                            onChange={e => handleRxItemChange(idx, 'Duration', e.target.value)} 
                            required 
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <input 
                            type="number" 
                            className="form-input text-xs" 
                            placeholder="Qty" 
                            min="1" 
                            value={item.Quantity} 
                            onChange={e => handleRxItemChange(idx, 'Quantity', e.target.value)} 
                            required 
                          />
                        </div>

                        {rxItems.length > 1 && (
                          <button type="button" className="btn btn-danger text-xs" style={{ padding: '6px' }} onClick={() => handleRemoveRxItem(idx)}>
                            Delete
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <input 
                          type="text" 
                          className="form-input text-xs" 
                          placeholder="Special instructions (e.g. take after food)..." 
                          value={item.Instructions} 
                          onChange={e => handleRxItemChange(idx, 'Instructions', e.target.value)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Clinical Advice / Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Drink plenty of water, avoid hot liquids, etc."
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRxModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save & Issue Rx</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
