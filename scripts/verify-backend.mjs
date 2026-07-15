// One-shot backend verification: connection, migrations, RLS, seed, trigger.
// Run: node scripts/verify-backend.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const out = {};

// 1 · Tables exist? (anon sees empty rows if RLS is on; an error means no table)
for (const table of ['patients', 'invoices', 'profiles']) {
  const { data, error } = await supabase.from(table).select('id').limit(1);
  out[`table:${table}`] = error ? `ERROR: ${error.message}` : `ok (anon sees ${data.length} rows — RLS ${data.length === 0 ? 'blocking ✓' : 'NOT blocking ✗'})`;
}

// 2 · Reporting function exists?
{
  const { error } = await supabase.rpc('period_summary', { granularity: 'month', start_date: '2026-01-01', end_date: '2026-12-31' });
  out['fn:period_summary'] = error ? `ERROR: ${error.message}` : 'ok (callable)';
}

// 3 · Auth: try the project's long-standing demo password for the doctor login.
{
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@drzaiddental.com',
    password: 'admin123',
  });
  if (error) {
    out['auth:doctor'] = `sign-in failed: ${error.message} (fine if you chose a different password — test via the app later)`;
  } else {
    out['auth:doctor'] = `ok — signed in as ${data.user.email}`;
    const { data: prof, error: pErr } = await supabase.from('profiles').select('name, role').eq('id', data.user.id).single();
    out['profile'] = pErr ? `ERROR: ${pErr.message} (did you run the profiles INSERTs?)` : `ok — ${prof.name} / ${prof.role}`;
    const { data: invs, error: iErr } = await supabase.from('invoices').select('invoice_number, total_amount, paid_amount, balance_due, status').order('invoice_number');
    out['seed+trigger'] = iErr
      ? `ERROR: ${iErr.message}`
      : invs.map((i) => `${i.invoice_number}: ${i.status} (${i.paid_amount}/${i.total_amount}, bal ${i.balance_due})`).join(' | ');
    const { count } = await supabase.from('patients').select('id', { count: 'exact', head: true });
    out['patients.count'] = count;
    await supabase.auth.signOut();
  }
}

console.log(JSON.stringify(out, null, 2));
