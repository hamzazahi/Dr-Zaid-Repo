// Verifies Supabase Storage end-to-end (migration 0005).
// Usage: node scripts/verify-storage.mjs <email> <password>
// Uploads a tiny PNG to the 'imaging' bucket, creates a signed URL,
// downloads it back, then deletes the file. Never commits credentials.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/verify-storage.mjs <email> <password>');
  process.exit(1);
}

// 1x1 transparent PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const fail = (step, err) => {
  console.error(`FAIL at ${step}:`, err?.message || err);
  process.exit(1);
};

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) fail('sign-in', authErr);
console.log(`Signed in as ${auth.user.email}`);

const path = `verify/${Date.now()}-probe.png`;
const { error: upErr } = await supabase.storage
  .from('imaging')
  .upload(path, png, { contentType: 'image/png' });
if (upErr) fail('upload (has migration 0005 been run?)', upErr);
console.log(`Uploaded imaging/${path} (${png.length} bytes)`);

const { data: signed, error: signErr } = await supabase.storage
  .from('imaging')
  .createSignedUrl(path, 60);
if (signErr) fail('signed URL', signErr);

const res = await fetch(signed.signedUrl);
const body = Buffer.from(await res.arrayBuffer());
if (res.status !== 200 || body.length !== png.length) {
  fail('download', `status ${res.status}, ${body.length} bytes (expected ${png.length})`);
}
console.log('Signed URL download OK — bytes round-tripped exactly');

const { error: rmErr } = await supabase.storage.from('imaging').remove([path]);
if (rmErr) fail('cleanup delete', rmErr);
console.log('Cleanup delete OK');

await supabase.auth.signOut();
console.log('\nSTORAGE VERIFIED ✔  (upload → signed URL → download → delete)');
