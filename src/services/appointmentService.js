import { supabase } from '../lib/supabase';

// Appointments - joined to patients/staff so the UI keeps receiving the flat
// { patientName, dentistName } shape it has always rendered.

const JOIN = '*, patients(name), staff(name)';

const fromRow = (r) => ({
  id: r.id,
  patientId: r.patient_id,
  patientName: r.patients?.name ?? 'Unknown Patient',
  dentistId: r.dentist_id ?? '',
  dentistName: r.staff?.name ?? 'Unassigned',
  locationId: r.location_id ?? null,
  date: r.date,
  time: r.time ?? '',
  type: r.type ?? '',
  status: r.status,
  notes: r.notes ?? '',
});

export const appointmentService = {
  async list() {
    const { data, error } = await supabase
      .from('appointments')
      .select(JOIN)
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  },

  async create(appt) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: appt.patientId,
        dentist_id: appt.dentistId || null,
        location_id: appt.locationId || null,
        date: appt.date,
        time: appt.time ?? null,
        type: appt.type ?? null,
        status: appt.status ?? 'Scheduled',
        notes: appt.notes ?? null,
      })
      .select(JOIN)
      .single();
    if (error) throw error;
    return fromRow(data);
  },

  async updateStatus(id, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async assignDentist(id, dentistId) {
    const { error } = await supabase.from('appointments').update({ dentist_id: dentistId }).eq('id', id);
    if (error) throw error;
  },
};
