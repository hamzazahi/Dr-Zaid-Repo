# DentSuite backend — Supabase setup

The repo now contains everything the backend needs except your project keys.
Three things only you can do (≈15 minutes):

## 1 · Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → sign in → **New project**.
2. Name: `dentsuite` (any region close to Pakistan, e.g. Mumbai `ap-south-1`).
3. Save the **database password** somewhere safe.

## 2 · Run the migrations + seed
In the Supabase Dashboard → **SQL Editor** → New query, run these files
from this repo **in order** (paste contents, Run):
1. `supabase/migrations/0001_init.sql` — tables, billing trigger, reporting function
2. `supabase/migrations/0002_rls.sql` — roles + row-level security
3. `supabase/seed.sql` — development data
4. `supabase/migrations/0003_realtime.sql` — realtime on the clinical core
5. `supabase/migrations/0004_realtime_rest.sql` — realtime on everything else
6. `supabase/migrations/0005_storage.sql` — file storage buckets (Documents + Imaging uploads)
7. `supabase/migrations/0006_inventory.sql` — SKU + unit columns for the Inventory page
8. `supabase/migrations/0007_lab_dispatch.sql` — lab dispatch tracking
9. `supabase/migrations/0008_invoice_waive.sql` — waive (write off) an invoice
10. `supabase/migrations/0009_invoice_paid_adjust.sql` — let the doctor correct an invoice's paid amount
11. `supabase/migrations/0010_plan_categories.sql` — Implant / Ortho treatment plan categories and ordered stages

(3 and 4 enable cross-device live sync; the app works without them, but two
open front-desk screens won't update each other until they're run.
6 enables real file upload/preview on the Documents and Imaging pages —
without it those pages still work but save metadata-only records.
10 backs the Billing page's "Edit" dialog: correcting the paid amount
reconciles the payments ledger, so paid, balance and status stay derived.
11 adds the Implant and Ortho categories on Treatment Plans, with the stage
order and the healing periods those cases run through.)

**Verify the state machine:** Table Editor → `invoices` — you should see
INV-2026-001 `Partially Paid` (6000/12000), INV-2026-002 `Paid`,
INV-2026-003 `Unpaid`. The seed only inserted payments; the trigger set those.

## 3 · Create the two staff logins
Dashboard → **Authentication → Users → Add user** (check “Auto confirm”):
- `admin@drzaiddental.com` (doctor)
- `reception@drzaiddental.com` (receptionist)

Then SQL Editor, run:
```sql
insert into profiles (id, name, role, initials)
select id, 'Dr. Hamza Zahid', 'doctor', 'HZ'
from auth.users where email = 'admin@drzaiddental.com';

insert into profiles (id, name, role, initials)
select id, 'Bilal Hussain', 'receptionist', 'BH'
from auth.users where email = 'reception@drzaiddental.com';
```

## 4 · Connect the frontend
Copy `.env.example` → `.env`, paste **Project URL** and **anon public key**
from Dashboard → Project Settings → API. Restart `npm run dev`.

That's it. Then tell Claude “keys are in” and Phase 2 begins: swapping
AuthContext to Supabase Auth and migrating modules one by one
(`src/services/patientService.js` is the pattern each module follows).

## What's already in the repo
| Piece | File |
|---|---|
| Supabase client (graceful when unconfigured) | `src/lib/supabase.js` |
| Schema: 30 tables, FKs, CHECK constraints | `supabase/migrations/0001_init.sql` |
| Billing state machine as DB triggers (overpayment impossible) | same file |
| `period_summary()` reporting function (daily/weekly/monthly/quarterly) | same file |
| Doctor/receptionist RLS permission matrix | `supabase/migrations/0002_rls.sql` |
| Dev seed mirroring the mock data | `supabase/seed.sql` |
| Services-layer pattern | `src/services/patientService.js` |

## Security notes
- Only the **anon** key goes in `.env` (safe in the browser — RLS is the lock).
- Never commit `.env` (already gitignored) or use the `service_role` key client-side.
- Receptionist logins physically cannot write clinical records or read expenses —
  the database refuses, regardless of what any UI does.
