// Live role + state-machine verification against the real Supabase project.
// Usage: node scripts/verify-roles.mjs <doctorEmail> <doctorPw> <receptionEmail> <receptionPw>
// Credentials come from argv so none are committed to the repo.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const [docEmail, docPw, recEmail, recPw] = process.argv.slice(2);
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const out = {};

// ══ DOCTOR ══
{
  const { data, error } = await supabase.auth.signInWithPassword({ email: docEmail, password: docPw });
  if (error) { out['doctor.signin'] = `FAIL: ${error.message}`; console.log(JSON.stringify(out, null, 2)); process.exit(1); }
  out['doctor.signin'] = 'ok';

  const { data: prof } = await supabase.from('profiles').select('name, role').eq('id', data.user.id).single();
  out['doctor.profile'] = prof ? `${prof.name} / ${prof.role}` : 'MISSING — run profiles INSERT from BACKEND.md';

  const { data: invs } = await supabase.from('invoices').select('invoice_number, paid_amount, total_amount, status').order('invoice_number');
  out['seed.trigger.statuses'] = invs?.map((i) => `${i.invoice_number}=${i.status}(${i.paid_amount}/${i.total_amount})`).join(' | ') || 'no invoices';

  const { count } = await supabase.from('patients').select('id', { count: 'exact', head: true });
  out['doctor.patients.visible'] = count;

  const { count: expCount, error: expErr } = await supabase.from('expenses').select('id', { count: 'exact', head: true });
  out['doctor.expenses.visible'] = expErr ? `ERR ${expErr.message}` : expCount;

  // Live state-machine test on INV-2026-003 (seeded Unpaid, 5000):
  const inv3 = invs?.find((i) => i.invoice_number === 'INV-2026-003');
  if (inv3 && inv3.status === 'Unpaid') {
    const { data: invRow } = await supabase.from('invoices').select('id, patient_id').eq('invoice_number', 'INV-2026-003').single();
    // 1. Overpayment must be REFUSED by the trigger guard
    const { error: overErr } = await supabase.from('payments').insert({ invoice_id: invRow.id, patient_id: invRow.patient_id, amount: 999999, method: 'Cash' });
    out['guard.overpayment'] = overErr ? `refused ✓ (${overErr.message.slice(0, 60)})` : 'NOT REFUSED ✗';
    // 2. Partial payment flips status to Partially Paid
    const { data: pay, error: payErr } = await supabase.from('payments').insert({ invoice_id: invRow.id, patient_id: invRow.patient_id, amount: 1000, method: 'Cash' }).select().single();
    if (payErr) out['trigger.partial'] = `ERR ${payErr.message}`;
    else {
      const { data: after } = await supabase.from('invoices').select('status, paid_amount, balance_due').eq('id', invRow.id).single();
      out['trigger.partial'] = `${after.status} paid=${after.paid_amount} bal=${after.balance_due}`;
      // 3. Deleting the payment reverts to Unpaid
      await supabase.from('payments').delete().eq('id', pay.id);
      const { data: reverted } = await supabase.from('invoices').select('status, paid_amount').eq('id', invRow.id).single();
      out['trigger.revert'] = `${reverted.status} paid=${reverted.paid_amount}`;
    }
  } else {
    out['trigger.test'] = 'skipped (INV-2026-003 not in expected seed state)';
  }
  await supabase.auth.signOut();
}

// ══ RECEPTIONIST ══
{
  const { data, error } = await supabase.auth.signInWithPassword({ email: recEmail, password: recPw });
  if (error) { out['reception.signin'] = `FAIL: ${error.message}`; }
  else {
    out['reception.signin'] = 'ok';
    const { data: prof } = await supabase.from('profiles').select('name, role').eq('id', data.user.id).single();
    out['reception.profile'] = prof ? `${prof.name} / ${prof.role}` : 'MISSING — run profiles INSERT from BACKEND.md';

    const { count: pc } = await supabase.from('patients').select('id', { count: 'exact', head: true });
    out['reception.patients.visible'] = pc;

    // RLS: clinical write must be REFUSED
    const { data: anyPatient } = await supabase.from('patients').select('id').limit(1).single();
    const { error: rxErr } = await supabase.from('prescriptions').insert({ patient_id: anyPatient.id, medication: 'RLS test' });
    out['rls.prescription.write'] = rxErr ? `refused ✓ (${rxErr.code})` : 'NOT REFUSED ✗ — receptionist wrote a prescription!';

    // RLS: expenses must be invisible
    const { count: ec } = await supabase.from('expenses').select('id', { count: 'exact', head: true });
    out['rls.expenses.visible'] = ec === 0 ? 'hidden ✓ (0 rows)' : `VISIBLE ✗ (${ec} rows)`;
    await supabase.auth.signOut();
  }
}

console.log(JSON.stringify(out, null, 2));
