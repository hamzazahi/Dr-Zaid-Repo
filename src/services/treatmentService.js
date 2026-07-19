import { supabase } from '../lib/supabase';

// Treatments (clinical) - RLS: both roles read, only the doctor writes.

const JOIN = '*, patients(name)';

const fromRow = (r) => ({
  id: r.id,
  patientId: r.patient_id,
  patientName: r.patients?.name ?? 'Unknown Patient',
  dentistId: r.dentist_id ?? null,
  date: r.date,
  type: r.type,
  toothNumber: r.tooth_number ?? 'All',
  cost: Number(r.cost) || 0,
  notes: r.notes ?? '',
});

export const treatmentService = {
  async list() {
    const { data, error } = await supabase
      .from('treatments')
      .select(JOIN)
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  },

  async create(t) {
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        patient_id: t.patientId,
        dentist_id: t.dentistId || null,
        type: t.type,
        tooth_number: t.toothNumber ?? 'All',
        cost: Number(t.cost) || 0,
        notes: t.notes ?? null,
      })
      .select(JOIN)
      .single();
    if (error) throw error;
    return fromRow(data);
  },
};
