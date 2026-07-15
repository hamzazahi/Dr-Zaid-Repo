import { supabase } from '../lib/supabase';

// Staff roster (dentists are derived from this list in ClinicContext).
// RLS: both roles read; only the doctor writes.

const fromRow = (r) => ({
  id: r.id,
  name: r.name,
  role: r.role,
  specialty: r.specialty ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  status: r.status,
  joinedDate: r.joined_date,
  locationId: r.location_id ?? null,
});

export const staffService = {
  async list() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(fromRow);
  },

  async create(member) {
    const { data, error } = await supabase
      .from('staff')
      .insert({
        name: member.name,
        role: member.role ?? 'Receptionist',
        specialty: member.specialty ?? null,
        email: member.email ?? null,
        phone: member.phone ?? null,
        status: member.status ?? 'Active',
        location_id: member.locationId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  },

  async updateStatus(id, status) {
    const { error } = await supabase.from('staff').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async assignLocation(id, locationId) {
    const { error } = await supabase.from('staff').update({ location_id: locationId }).eq('id', id);
    if (error) throw error;
  },
};
