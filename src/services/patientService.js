import { supabase, isSupabaseConfigured } from '../lib/supabase';

// PATTERN FILE — the reference for every entity service (Phase 3).
//
// Each service exposes the same verbs the ClinicContext handlers need
// (list / create / update / remove) and translates between the frontend's
// camelCase shapes and the database's snake_case columns. ClinicContext
// stays the single consumer; pages never import services directly.
//
// While Supabase is unconfigured (.env missing) the context keeps using its
// local data layer — check `isSupabaseConfigured` before switching a module.

const toRow = (p) => ({
  name: p.name,
  gender: p.gender ?? null,
  dob: p.dob || null,
  phone: p.phone ?? null,
  email: p.email ?? null,
  address: p.address ?? null,
  allergies: p.allergies ?? 'None',
  status: p.status ?? 'Active',
  blood_group: p.bloodGroup ?? null,
});

// For UPDATEs: only map the keys actually provided, so a status-only update
// can never null out the rest of the record.
const FIELD_MAP = { name: 'name', gender: 'gender', dob: 'dob', phone: 'phone', email: 'email', address: 'address', allergies: 'allergies', status: 'status', bloodGroup: 'blood_group' };
const toPartialRow = (updates) => {
  const row = {};
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (updates[key] !== undefined) row[col] = key === 'dob' && !updates[key] ? null : updates[key];
  }
  return row;
};

const fromRow = (r) => ({
  id: r.id,
  name: r.name,
  gender: r.gender ?? '',
  dob: r.dob ?? '',
  phone: r.phone ?? '',
  email: r.email ?? '',
  address: r.address ?? '',
  allergies: r.allergies ?? 'None',
  status: r.status,
  registrationDate: r.registration_date,
  bloodGroup: r.blood_group ?? '',
});

export const patientService = {
  isLive: () => isSupabaseConfigured,

  async list() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  },

  async create(patient) {
    const { data, error } = await supabase
      .from('patients')
      .insert(toRow(patient))
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(toPartialRow(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  },

  async remove(id) {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  },

  // Live multi-device sync: call with a callback, returns an unsubscribe fn.
  subscribe(onChange) {
    const channel = supabase
      .channel('patients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, onChange)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
