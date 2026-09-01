import { supabase } from '../lib/supabase';

// Live services for every remaining entity (Phase 3b).
// Each namespace maps DB snake_case rows to the exact camelCase shapes the
// UI has always consumed, so pages need zero changes.

const q = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const P_NAME = 'patients(name)';
const S_NAME = 'staff(name)';

// ── Prescriptions ────────────────────────────────────────────────────────────
const rxFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  dentistId: r.dentist_id ?? null, doctorName: r.staff?.name ?? 'Unknown',
  medication: r.medication, dosage: r.dosage ?? '', frequency: r.frequency ?? '',
  duration: r.duration ?? '', date: r.date, status: r.status,
});
const prescriptions = {
  list: async () => (await q(supabase.from('prescriptions').select(`*, ${P_NAME}, ${S_NAME}`).order('date', { ascending: false }))).map(rxFrom),
  create: async (d) => rxFrom(await q(supabase.from('prescriptions').insert({
    patient_id: d.patientId, dentist_id: d.dentistId || null, medication: d.medication,
    dosage: d.dosage ?? null, frequency: d.frequency ?? null, duration: d.duration ?? null,
    status: d.status ?? 'active',
  }).select(`*, ${P_NAME}, ${S_NAME}`).single())),
  updateStatus: (id, status) => q(supabase.from('prescriptions').update({ status }).eq('id', id)),
};

// ── Treatment plans (+ items) ────────────────────────────────────────────────
const planFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  dentistId: r.dentist_id ?? null, dentistName: r.staff?.name ?? 'Unassigned',
  title: r.title, status: r.status, createdDate: r.created_date, invoiceId: r.invoice_id ?? null,
  items: (r.plan_items ?? []).map((it) => ({ id: it.id, procedure: it.procedure, toothNumber: it.tooth_number ?? '-', cost: Number(it.cost) || 0, done: it.done })),
});
const treatmentPlans = {
  list: async () => (await q(supabase.from('treatment_plans').select(`*, ${P_NAME}, ${S_NAME}, plan_items(*)`).order('created_at', { ascending: false }))).map(planFrom),
  create: async (d, items) => {
    const plan = await q(supabase.from('treatment_plans').insert({
      patient_id: d.patientId, dentist_id: d.dentistId || null, title: d.title?.trim() || 'Treatment Plan',
    }).select().single());
    if (items.length) {
      await q(supabase.from('plan_items').insert(items.map((it) => ({
        plan_id: plan.id, procedure: it.procedure, tooth_number: it.toothNumber || '-', cost: Number(it.cost) || 0,
      }))).select());
    }
    const full = await q(supabase.from('treatment_plans').select(`*, ${P_NAME}, ${S_NAME}, plan_items(*)`).eq('id', plan.id).single());
    return planFrom(full);
  },
  update: (id, patch) => q(supabase.from('treatment_plans').update(patch).eq('id', id)),
  setItemDone: (itemId, done) => q(supabase.from('plan_items').update({ done }).eq('id', itemId)),
};

// ── Lab cases ────────────────────────────────────────────────────────────────
const labFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  dentistId: r.dentist_id ?? null, dentistName: r.staff?.name ?? 'Unassigned',
  labName: r.lab_name, caseType: r.case_type ?? '', toothNumber: r.tooth_number ?? '-',
  units: Number(r.units) || 1, status: r.status, cost: Number(r.cost) || 0,
  sentDate: r.sent_date, dueDate: r.due_date ?? '', receivedDate: r.received_date,
  sentBy: r.sent_by ?? '', receivedBy: r.received_by ?? '', whatsappSent: Boolean(r.whatsapp_sent),
  notes: r.notes ?? '',
});
const labCases = {
  list: async () => (await q(supabase.from('lab_cases').select(`*, ${P_NAME}, ${S_NAME}`).order('sent_date', { ascending: false }))).map(labFrom),
  create: async (d) => labFrom(await q(supabase.from('lab_cases').insert({
    patient_id: d.patientId, dentist_id: d.dentistId || null, lab_name: d.labName?.trim() || 'External Lab',
    case_type: d.caseType ?? null, tooth_number: d.toothNumber ?? null, units: Number(d.units) || 1,
    cost: Number(d.cost) || 0, due_date: d.dueDate || null, sent_by: d.sentBy?.trim() || null,
    whatsapp_sent: Boolean(d.whatsappSent), notes: d.notes?.trim() || null,
  }).select(`*, ${P_NAME}, ${S_NAME}`).single())),
  update: (id, patch) => q(supabase.from('lab_cases').update(patch).eq('id', id)),
};

// ── Recalls ──────────────────────────────────────────────────────────────────
const recallFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  type: r.type, dueDate: r.due_date ?? '', status: r.status, channel: r.channel,
  notes: r.notes ?? '', lastReminderAt: r.last_reminder_at,
});
const recalls = {
  list: async () => (await q(supabase.from('recalls').select(`*, ${P_NAME}`).order('due_date', { ascending: true }))).map(recallFrom),
  create: async (d) => recallFrom(await q(supabase.from('recalls').insert({
    patient_id: d.patientId, type: d.type || '6-Month Checkup', due_date: d.dueDate || null,
    channel: d.channel || 'WhatsApp', notes: d.notes?.trim() || null,
  }).select(`*, ${P_NAME}`).single())),
  update: (id, patch) => q(supabase.from('recalls').update(patch).eq('id', id)),
};

// ── Documents ────────────────────────────────────────────────────────────────
const docFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  name: r.name, category: r.category ?? 'Other', fileType: r.file_type ?? 'FILE',
  size: Number(r.size) || 0, uploadedDate: r.uploaded_date, uploadedBy: r.uploaded_by ?? 'Staff',
  notes: r.notes ?? '', storagePath: r.storage_path ?? null,
});
const documents = {
  list: async () => (await q(supabase.from('documents').select(`*, ${P_NAME}`).order('uploaded_date', { ascending: false }))).map(docFrom),
  create: async (d) => docFrom(await q(supabase.from('documents').insert({
    patient_id: d.patientId, name: d.name?.trim() || 'Untitled', category: d.category ?? 'Other',
    file_type: d.fileType ?? 'FILE', size: Number(d.size) || 0, uploaded_by: d.uploadedBy?.trim() || 'Staff',
    notes: d.notes?.trim() || null, storage_path: d.storagePath ?? null,
  }).select(`*, ${P_NAME}`).single())),
  remove: (id) => q(supabase.from('documents').delete().eq('id', id)),
};

// ── Expenses ─────────────────────────────────────────────────────────────────
const expenseFrom = (r) => ({
  id: r.id, date: r.date, category: r.category, vendor: r.vendor ?? '', description: r.description ?? '',
  amount: Number(r.amount) || 0, method: r.method ?? 'Cash', status: r.status,
});
const expenses = {
  list: async () => (await q(supabase.from('expenses').select('*').order('date', { ascending: false }))).map(expenseFrom),
  create: async (d) => expenseFrom(await q(supabase.from('expenses').insert({
    date: d.date || undefined, category: d.category ?? 'Other', vendor: d.vendor?.trim() || null,
    description: d.description?.trim() || null, amount: Number(d.amount) || 0,
    method: d.method ?? 'Cash', status: d.status ?? 'Paid',
  }).select().single())),
  update: (id, patch) => q(supabase.from('expenses').update(patch).eq('id', id)),
  remove: (id) => q(supabase.from('expenses').delete().eq('id', id)),
};

// ── Claims ───────────────────────────────────────────────────────────────────
const claimFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  payer: r.payer, policyNumber: r.policy_number ?? '', serviceDate: r.service_date,
  submittedDate: r.submitted_date, procedures: r.procedures ?? '',
  claimedAmount: Number(r.claimed_amount) || 0, approvedAmount: Number(r.approved_amount) || 0,
  status: r.status, notes: r.notes ?? '',
});
const claims = {
  list: async () => (await q(supabase.from('claims').select(`*, ${P_NAME}`).order('submitted_date', { ascending: false }))).map(claimFrom),
  create: async (d) => claimFrom(await q(supabase.from('claims').insert({
    patient_id: d.patientId, payer: d.payer ?? 'Self-Pay / None', policy_number: d.policyNumber?.trim() || null,
    service_date: d.serviceDate || null, procedures: d.procedures?.trim() || null,
    claimed_amount: Number(d.claimedAmount) || 0, status: d.status ?? 'Submitted', notes: d.notes?.trim() || null,
  }).select(`*, ${P_NAME}`).single())),
  update: (id, patch) => q(supabase.from('claims').update(patch).eq('id', id)),
  remove: (id) => q(supabase.from('claims').delete().eq('id', id)),
};

// ── Booking requests ─────────────────────────────────────────────────────────
const bookingFrom = (r) => ({
  id: r.id, patientName: r.patient_name, phone: r.phone ?? '', email: r.email ?? '',
  patientId: r.patient_id ?? null, preferredDate: r.preferred_date, preferredTime: r.preferred_time ?? '',
  service: r.service ?? '', reason: r.reason ?? '', status: r.status, source: r.source ?? 'Online',
  submittedDate: r.submitted_date, appointmentId: r.appointment_id ?? null,
});
const bookings = {
  list: async () => (await q(supabase.from('booking_requests').select('*').order('submitted_date', { ascending: false }))).map(bookingFrom),
  create: async (d) => bookingFrom(await q(supabase.from('booking_requests').insert({
    patient_name: d.patientName?.trim() || 'New Patient', phone: d.phone?.trim() || null, email: d.email?.trim() || null,
    patient_id: d.patientId || null, preferred_date: d.preferredDate || null, preferred_time: d.preferredTime ?? null,
    service: d.service ?? null, reason: d.reason?.trim() || null, source: d.source ?? 'Online',
  }).select().single())),
  update: (id, patch) => q(supabase.from('booking_requests').update(patch).eq('id', id)),
};

// ── Memberships ──────────────────────────────────────────────────────────────
const planRowFrom = (r) => ({
  id: r.id, name: r.name, price: Number(r.price) || 0, cycle: r.cycle,
  discount: r.discount ?? 0, benefits: r.benefits ?? '', color: r.color ?? '#0F4C81',
});
const membershipFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  planId: r.plan_id, planName: r.membership_plans?.name ?? 'Plan', cycle: r.membership_plans?.cycle ?? 'Annual',
  startDate: r.start_date, renewalDate: r.renewal_date, status: r.status, price: Number(r.price) || 0,
});
const memberships = {
  listPlans: async () => (await q(supabase.from('membership_plans').select('*').order('created_at', { ascending: true }))).map(planRowFrom),
  createPlan: async (d) => planRowFrom(await q(supabase.from('membership_plans').insert({
    name: d.name?.trim() || 'New Plan', price: Number(d.price) || 0, cycle: d.cycle ?? 'Annual',
    discount: Number(d.discount) || 0, benefits: d.benefits?.trim() || null, color: d.color ?? '#0F4C81',
  }).select().single())),
  list: async () => (await q(supabase.from('memberships').select(`*, ${P_NAME}, membership_plans(name, cycle)`).order('created_at', { ascending: false }))).map(membershipFrom),
  enroll: async (d) => membershipFrom(await q(supabase.from('memberships').insert({
    patient_id: d.patientId, plan_id: d.planId, start_date: d.startDate || undefined,
    renewal_date: d.renewalDate || null, price: Number(d.price) || 0,
  }).select(`*, ${P_NAME}, membership_plans(name, cycle)`).single())),
  update: (id, patch) => q(supabase.from('memberships').update(patch).eq('id', id)),
};

// ── Form submissions ─────────────────────────────────────────────────────────
const formFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  templateId: r.template_id, templateName: r.template_name, category: r.category ?? 'Other',
  status: r.status, sentDate: r.sent_date, completedDate: r.completed_date,
  signedBy: r.signed_by, signatureDate: r.signature_date,
});
const forms = {
  list: async () => (await q(supabase.from('form_submissions').select(`*, ${P_NAME}`).order('sent_date', { ascending: false }))).map(formFrom),
  create: async (d) => formFrom(await q(supabase.from('form_submissions').insert({
    patient_id: d.patientId, template_id: d.templateId, template_name: d.templateName || 'Form', category: d.category ?? 'Other',
  }).select(`*, ${P_NAME}`).single())),
  update: (id, patch) => q(supabase.from('form_submissions').update(patch).eq('id', id)),
  remove: (id) => q(supabase.from('form_submissions').delete().eq('id', id)),
};

// ── Campaigns ────────────────────────────────────────────────────────────────
const campaignFrom = (r) => ({
  id: r.id, name: r.name, channel: r.channel, segment: r.segment, subject: r.subject ?? '',
  body: r.body ?? '', status: r.status, recipients: r.recipients ?? 0,
  createdDate: r.created_date, sentAt: r.sent_at,
});
const campaigns = {
  list: async () => (await q(supabase.from('campaigns').select('*').order('created_date', { ascending: false }))).map(campaignFrom),
  create: async (d) => campaignFrom(await q(supabase.from('campaigns').insert({
    name: d.name?.trim() || 'Untitled Campaign', segment: d.segment ?? 'All Patients',
    subject: d.subject?.trim() || null, body: d.body?.trim() || null,
  }).select().single())),
  update: (id, patch) => q(supabase.from('campaigns').update(patch).eq('id', id)),
  remove: (id) => q(supabase.from('campaigns').delete().eq('id', id)),
};

// ── Referrals ────────────────────────────────────────────────────────────────
const referralFrom = (r) => ({
  id: r.id, direction: r.direction, patientId: r.patient_id ?? null, patientName: r.patient_name,
  provider: r.provider ?? '', practice: r.practice ?? '', specialty: r.specialty ?? '',
  reason: r.reason ?? '', date: r.date, status: r.status, notes: r.notes ?? '',
});
const referrals = {
  list: async () => (await q(supabase.from('referrals').select('*').order('date', { ascending: false }))).map(referralFrom),
  create: async (d) => referralFrom(await q(supabase.from('referrals').insert({
    direction: d.direction === 'Inbound' ? 'Inbound' : 'Outbound', patient_id: d.patientId || null,
    patient_name: d.patientName, provider: d.provider?.trim() || null, practice: d.practice?.trim() || null,
    specialty: d.specialty ?? null, reason: d.reason?.trim() || null, notes: d.notes?.trim() || null,
  }).select().single())),
  update: (id, patch) => q(supabase.from('referrals').update(patch).eq('id', id)),
};

// ── Imaging ──────────────────────────────────────────────────────────────────
const imagingFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  type: r.type, toothNumber: r.tooth_number ?? 'All', date: r.date, takenBy: r.taken_by ?? 'Staff',
  notes: r.notes ?? '', storagePath: r.storage_path ?? null,
});
const imaging = {
  list: async () => (await q(supabase.from('imaging_records').select(`*, ${P_NAME}`).order('date', { ascending: false }))).map(imagingFrom),
  create: async (d) => imagingFrom(await q(supabase.from('imaging_records').insert({
    patient_id: d.patientId, type: d.type ?? 'Periapical X-Ray', tooth_number: d.toothNumber ?? 'All',
    date: d.date || undefined, taken_by: d.takenBy?.trim() || 'Staff', notes: d.notes?.trim() || null,
    storage_path: d.storagePath ?? null,
  }).select(`*, ${P_NAME}`).single())),
  remove: (id) => q(supabase.from('imaging_records').delete().eq('id', id)),
};

// ── Locations ────────────────────────────────────────────────────────────────
const locationFrom = (r) => ({
  id: r.id, name: r.name, address: r.address ?? '', phone: r.phone ?? '', email: r.email ?? '',
  manager: r.manager ?? '', chairs: r.chairs ?? 1, openHours: r.open_hours ?? '',
  status: r.status, color: r.color ?? '#0F4C81', isPrimary: r.is_primary,
});
const locations = {
  list: async () => (await q(supabase.from('locations').select('*').order('created_at', { ascending: true }))).map(locationFrom),
  create: async (d) => locationFrom(await q(supabase.from('locations').insert({
    name: d.name?.trim() || 'New Location', address: d.address?.trim() || null, phone: d.phone?.trim() || null,
    email: d.email?.trim() || null, manager: d.manager?.trim() || null, chairs: Number(d.chairs) || 1,
    open_hours: d.openHours?.trim() || null, color: d.color ?? '#0F4C81',
  }).select().single())),
  update: (id, patch) => q(supabase.from('locations').update(patch).eq('id', id)),
};

// ── Conversations & messages ─────────────────────────────────────────────────
const conversationFrom = (r) => ({
  id: r.id, patientId: r.patient_id, patientName: r.patients?.name ?? 'Unknown',
  channel: r.channel, unread: r.unread,
  messages: (r.messages ?? [])
    .slice()
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .map((m) => ({ id: m.id, from: m.sender, text: m.body, at: m.at })),
});
const conversations = {
  list: async () => (await q(supabase.from('conversations').select(`*, ${P_NAME}, messages(*)`).order('created_at', { ascending: false }))).map(conversationFrom),
  create: async ({ patientId, channel }) => q(supabase.from('conversations').insert({ patient_id: patientId, channel: channel ?? 'WhatsApp' }).select().single()),
  update: (id, patch) => q(supabase.from('conversations').update(patch).eq('id', id)),
  addMessage: async (conversationId, body) => q(supabase.from('messages').insert({ conversation_id: conversationId, sender: 'clinic', body }).select().single()),
};

// ── Dental & perio charting ──────────────────────────────────────────────────
const charting = {
  // rows → { [patientId]: { [tooth]: {status, surfaces, notes, updatedAt} } }
  listToothRecords: async () => {
    const rows = await q(supabase.from('tooth_records').select('*'));
    const nested = {};
    rows.forEach((r) => {
      nested[r.patient_id] = nested[r.patient_id] || {};
      nested[r.patient_id][r.tooth_number] = { status: r.status, surfaces: r.surfaces ?? '', notes: r.notes ?? '', updatedAt: r.updated_at };
    });
    return nested;
  },
  listToothHistory: async () => (await q(supabase.from('tooth_history').select('*').order('at', { ascending: false }).limit(1000)))
    .map((r) => ({ id: r.id, patientId: r.patient_id, toothNumber: r.tooth_number, prevStatus: r.prev_status ?? 'Healthy', newStatus: r.new_status, surfaces: r.surfaces ?? '', notes: r.notes ?? '', at: r.at })),
  upsertTooth: (patientId, toothNumber, rec) => q(supabase.from('tooth_records').upsert({
    patient_id: patientId, tooth_number: toothNumber, status: rec.status, surfaces: rec.surfaces ?? '', notes: rec.notes ?? '', updated_at: new Date().toISOString(),
  }, { onConflict: 'patient_id,tooth_number' })),
  addToothHistory: (h) => q(supabase.from('tooth_history').insert({
    patient_id: h.patientId, tooth_number: h.toothNumber, prev_status: h.prevStatus, new_status: h.newStatus, surfaces: h.surfaces ?? '', notes: h.notes ?? '',
  })),
  listPerio: async () => {
    const rows = await q(supabase.from('perio_entries').select('*'));
    const nested = {};
    rows.forEach((r) => {
      nested[r.patient_id] = nested[r.patient_id] || {};
      nested[r.patient_id][r.tooth_number] = { depths: r.depths ?? [], bop: r.bop, updatedAt: r.updated_at };
    });
    return nested;
  },
  upsertPerio: (patientId, toothNumber, data) => q(supabase.from('perio_entries').upsert({
    patient_id: patientId, tooth_number: toothNumber, depths: data.depths ?? [], bop: Boolean(data.bop), updated_at: new Date().toISOString(),
  }, { onConflict: 'patient_id,tooth_number' })),
};

// ── Inventory ────────────────────────────────────────────────────────────────
const stockStatus = (qty, min) => (qty <= 0 ? 'out-of-stock' : qty <= min ? 'low' : 'in-stock');
const STOCK_LABELS = { 'in-stock': 'In Stock', low: 'Low Stock', 'out-of-stock': 'Out of Stock' };
const invFrom = (r) => ({
  id: r.id, name: r.name, sku: r.sku ?? '', category: r.category ?? 'Supplies',
  quantity: r.current_stock ?? 0, minLevel: r.reorder_level ?? 0, unit: r.unit ?? 'pcs',
  supplier: r.supplier ?? '', unitPrice: `Rs. ${Number(r.unit_price) || 0}`,
  status: stockStatus(r.current_stock ?? 0, r.reorder_level ?? 0),
});
const inventory = {
  list: async () => (await q(supabase.from('inventory').select('*').order('name'))).map(invFrom),
  create: async (d) => {
    const qty = Number(d.quantity) || 0;
    const min = Number(d.minLevel) || 0;
    const base = {
      name: d.name, category: d.category, supplier: d.supplier || null,
      current_stock: qty, reorder_level: min,
      unit_price: Number(d.unitPrice) || 0, status: STOCK_LABELS[stockStatus(qty, min)],
    };
    // sku + unit arrive with migration 0006; if it hasn't been run yet, retry
    // without them so the item still saves (they just won't persist until then).
    const { data, error } = await supabase.from('inventory')
      .insert({ ...base, sku: d.sku || null, unit: d.unit || 'pcs' }).select().single();
    if (error) {
      if (/column|schema cache/i.test(error.message)) {
        return invFrom(await q(supabase.from('inventory').insert(base).select().single()));
      }
      throw error;
    }
    return invFrom(data);
  },
};

// ── Audit log ────────────────────────────────────────────────────────────────
const audit = {
  // RLS: only the doctor can read the trail; receptionists get an empty list.
  list: async () => (await q(supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(1000)))
    .map((r) => ({ id: r.id, at: r.at, user: r.user_name ?? 'Staff', module: r.module, action: r.action, detail: r.detail ?? '' })),
  add: (entry) => q(supabase.from('audit_log').insert({ user_name: entry.user, module: entry.module, action: entry.action, detail: entry.detail }).select().single()),
};

export const entityServices = {
  prescriptions, treatmentPlans, labCases, recalls, documents, expenses, claims,
  bookings, memberships, forms, campaigns, referrals, imaging, locations,
  conversations, charting, audit, inventory,
};
