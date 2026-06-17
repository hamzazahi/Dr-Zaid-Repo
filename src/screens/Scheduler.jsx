import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Calendar, Clock, Plus, Filter, User, UserCheck, Stethoscope, AlertCircle, XCircle } from 'lucide-react';

export default function Scheduler() {
  const { 
    appointments, 
    patients, 
    users, 
    createAppointment, 
    updateAppointmentStatus, 
    currentUser 
  } = useDatabase();

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDentist, setFilterDentist] = useState('all');
  const [showBookModal, setShowBookModal] = useState(false);
  
  // Appointment Form fields
  const [patientId, setPatientId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [apptType, setApptType] = useState('Checkup');
  const [complaint, setComplaint] = useState('');
  
  // Status editing
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const dentists = users.filter(u => u.RoleId === 2 && u.IsActive);
  const assistants = users.filter(u => u.RoleId === 4 && u.IsActive);

  // Filter appointments
  const filteredAppointments = appointments.filter(appt => {
    const apptDateStr = appt.AppointmentDate.split('T')[0];
    const dateMatch = apptDateStr === filterDate;
    const dentistMatch = filterDentist === 'all' || appt.DentistUserId === Number(filterDentist);
    return dateMatch && dentistMatch;
  }).sort((a, b) => a.AppointmentDate.localeCompare(b.AppointmentDate));

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!patientId || !dentistId || !apptDate || !apptTime) {
      alert("Please fill in all required fields.");
      return;
    }

    const apptDateTime = `${apptDate}T${apptTime}:00`;
    
    createAppointment({
      PatientId: Number(patientId),
      DentistUserId: Number(dentistId),
      AssistantUserId: assistantId ? Number(assistantId) : null,
      AppointmentDate: apptDateTime,
      DurationMinutes: Number(duration),
      AppointmentType: apptType,
      ChiefComplaint: complaint,
      ClinicalNotes: null
    });

    // Reset Form
    setPatientId('');
    setDentistId('');
    setAssistantId('');
    setApptDate('');
    setApptTime('09:00');
    setDuration('30');
    setApptType('Checkup');
    setComplaint('');
    setShowBookModal(false);
  };

  const handleUpdateStatusSubmit = (e) => {
    e.preventDefault();
    updateAppointmentStatus(
      selectedApptId, 
      newStatus, 
      newStatus === 'Completed' ? clinicalNotes : null,
      newStatus === 'Cancelled' ? cancelReason : null
    );
    setSelectedApptId(null);
    setNewStatus('');
    setClinicalNotes('');
    setCancelReason('');
  };

  const triggerStatusUpdate = (appt) => {
    setSelectedApptId(appt.AppointmentId);
    setNewStatus(appt.Status);
    setClinicalNotes(appt.ClinicalNotes || '');
    setCancelReason(appt.CancellationReason || '');
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Appointment Scheduler</h1>
          <p className="text-sm text-muted">Manage clinical schedules, assign assistants, and log treatment notes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel flex flex-wrap gap-4 items-end">
        <div>
          <label className="form-label flex items-center gap-1"><Calendar size={14} /> Schedule Date</label>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '180px' }}
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label flex items-center gap-1"><User size={14} /> Filter by Dentist</label>
          <select 
            className="form-select" 
            style={{ width: '220px' }}
            value={filterDentist}
            onChange={e => setFilterDentist(e.target.value)}
          >
            <option value="all">All Dentists</option>
            {dentists.map(d => (
              <option key={d.UserId} value={d.UserId}>Dr. {d.FirstName} {d.LastName}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-muted pb-2">
          Found {filteredAppointments.length} appointments for this date
        </div>
      </div>

      {/* Scheduler Board */}
      <div className="glass-panel flex flex-col gap-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Clock size={18} className="text-primary" /> Daily Schedule - {new Date(filterDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-muted border border-dashed border-color rounded-lg">
            <Calendar size={48} className="mx-auto mb-3 opacity-30 text-teal-500" />
            <p className="font-semibold text-lg">No Appointments Scheduled</p>
            <p className="text-xs mt-1">Click "Book Appointment" to add a new slot for this day.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAppointments.map(appt => {
              const apptPatient = patients.find(p => p.PatientId === appt.PatientId);
              const apptDentist = users.find(u => u.UserId === appt.DentistUserId);
              const apptAssistant = users.find(u => u.UserId === appt.AssistantUserId);
              const time = new Date(appt.AppointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={appt.AppointmentId} className="flex border border-color rounded-lg bg-card overflow-hidden hover:border-text-muted transition-all">
                  {/* Time Block */}
                  <div className="w-24 bg-sidebar p-4 flex flex-col justify-center items-center border-r border-color">
                    <span className="text-lg font-bold text-primary">{time}</span>
                    <span className="text-xxs text-muted">{appt.DurationMinutes} Mins</span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xxs text-muted font-bold tracking-wider uppercase">Patient</div>
                      <div className="font-bold text-base mt-0.5 text-primary">
                        {apptPatient ? `${apptPatient.FirstName} ${apptPatient.LastName}` : 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-muted mt-0.5">MRN: {apptPatient?.MRN}</div>
                      {appt.ChiefComplaint && (
                        <div className="text-xs italic text-muted mt-2">
                          " {appt.ChiefComplaint} "
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xxs text-muted font-bold tracking-wider uppercase">Clinical Staff</div>
                      <div className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                        <Stethoscope size={14} className="text-teal-400" />
                        Dr. {apptDentist ? `${apptDentist.FirstName} ${apptDentist.LastName}` : 'Unassigned'}
                      </div>
                      {apptAssistant && (
                        <div className="text-xs text-muted mt-1 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-blue-400" />
                          Asst: {apptAssistant.FirstName} {apptAssistant.LastName}
                        </div>
                      )}
                      <div className="text-xs text-muted mt-2">
                        Type: <span className="font-semibold text-primary">{appt.AppointmentType}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-start md:items-end">
                      <span className={`badge badge-${
                        appt.Status === 'Completed' ? 'success' :
                        appt.Status === 'Confirmed' ? 'info' :
                        appt.Status === 'Cancelled' ? 'danger' :
                        appt.Status === 'No Show' ? 'muted' : 'warning'
                      }`}>
                        {appt.Status}
                      </span>

                      <div className="flex gap-2 mt-4 md:mt-0">
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => triggerStatusUpdate(appt)}
                        >
                          Update Status / Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleBookAppointment}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Book New Appointment</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowBookModal(false)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>
            
            <div className="modal-body grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Select Patient *</label>
                <select className="form-select" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.PatientId} value={p.PatientId}>{p.FirstName} {p.LastName} ({p.MRN})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Dentist *</label>
                <select className="form-select" value={dentistId} onChange={e => setDentistId(e.target.value)} required>
                  <option value="">-- Choose Dentist --</option>
                  {dentists.map(d => (
                    <option key={d.UserId} value={d.UserId}>Dr. {d.FirstName} {d.LastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Chairside Assistant</label>
                <select className="form-select" value={assistantId} onChange={e => setAssistantId(e.target.value)}>
                  <option value="">None</option>
                  {assistants.map(a => (
                    <option key={a.UserId} value={a.UserId}>{a.FirstName} {a.LastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Appointment Date *</label>
                <input type="date" className="form-input" value={apptDate} onChange={e => setApptDate(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-input" value={apptTime} onChange={e => setApptTime(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Duration</label>
                <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="90">1.5 Hours</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>

              <div>
                <label className="form-label">Appointment Type</label>
                <select className="form-select" value={apptType} onChange={e => setApptType(e.target.value)}>
                  <option value="Checkup & Evaluation">Checkup & Evaluation</option>
                  <option value="Teeth Cleaning">Teeth Cleaning</option>
                  <option value="Composite Filling">Composite Filling</option>
                  <option value="Crown Prep / Fit">Crown Prep / Fit</option>
                  <option value="Root Canal Treatment">Root Canal Treatment</option>
                  <option value="Surgical Extraction">Surgical Extraction</option>
                  <option value="Implant Consultation">Implant Consultation</option>
                  <option value="Whitening / Cosmetic">Whitening / Cosmetic</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="form-label">Chief Complaint / Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Patient complaint details..."
                  value={complaint}
                  onChange={e => setComplaint(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Booking</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Status Modal */}
      {selectedApptId !== null && (
        <div className="modal-overlay" onClick={() => setSelectedApptId(null)}>
          <form className="modal-content animate-scale" onClick={e => e.stopPropagation()} onSubmit={handleUpdateStatusSubmit} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="text-base font-bold">Update Appointment Status</h3>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setSelectedApptId(null)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>
            
            <div className="modal-body flex flex-col gap-4">
              <div>
                <label className="form-label">Select Status</label>
                <select 
                  className="form-select" 
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>

              {newStatus === 'Completed' && (
                <div>
                  <label className="form-label flex items-center gap-1 text-teal-400">
                    <UserCheck size={14} /> Clinical Evaluation Notes (Required for Completed)
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    placeholder="Enter dental charting notes, treatments performed..."
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}

              {newStatus === 'Cancelled' && (
                <div>
                  <label className="form-label flex items-center gap-1 text-red-400">
                    <XCircle size={14} /> Cancellation Reason (Required for Cancelled)
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Enter cancellation reason..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedApptId(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Update Status</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
