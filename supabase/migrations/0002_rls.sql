-- DentSuite · Migration 0002 — row-level security
-- Implements the doctor/receptionist permission matrix ON THE SERVER.
-- The frontend's usePermissions gating is UX; these policies are the law.
--
--   FULL_BOTH     → both roles read + write   (front-desk daily work)
--   CLINICAL      → both read, DOCTOR writes  (clinical records)
--   DOCTOR_ONLY   → doctor read + write only  (business/admin)
--   bespoke       → profiles, invoices, membership_plans, audit_log

-- Who is the caller? (security definer so it can read profiles despite RLS)
create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

do $$
declare
  t text;
  full_both text[] := array[
    'patients', 'appointments', 'recalls', 'booking_requests',
    'conversations', 'messages', 'payments', 'memberships',
    'documents', 'form_submissions', 'lab_cases', 'referrals',
    'inventory', 'claims'
  ];
  clinical text[] := array[
    'treatments', 'treatment_plans', 'plan_items', 'prescriptions',
    'tooth_records', 'tooth_history', 'perio_entries', 'imaging_records',
    'campaigns', 'staff', 'locations'
  ];
  doctor_only text[] := array['expenses'];
begin
  -- Front-desk tables: both roles, all operations.
  foreach t in array full_both loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "staff_all" on %I for all
         using (auth_role() in (''doctor'', ''receptionist''))
         with check (auth_role() in (''doctor'', ''receptionist''))', t);
  end loop;

  -- Clinical tables: both roles read, only the doctor writes.
  foreach t in array clinical loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "staff_read" on %I for select
         using (auth_role() in (''doctor'', ''receptionist''))', t);
    execute format(
      'create policy "doctor_insert" on %I for insert
         with check (auth_role() = ''doctor'')', t);
    execute format(
      'create policy "doctor_update" on %I for update
         using (auth_role() = ''doctor'') with check (auth_role() = ''doctor'')', t);
    execute format(
      'create policy "doctor_delete" on %I for delete
         using (auth_role() = ''doctor'')', t);
  end loop;

  -- Doctor-only tables.
  foreach t in array doctor_only loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "doctor_all" on %I for all
         using (auth_role() = ''doctor'') with check (auth_role() = ''doctor'')', t);
  end loop;
end $$;

-- ── Bespoke policies ─────────────────────────────────────────────────────────

-- profiles: any signed-in staff member can read names/roles (needed to render
-- the UI); nobody edits profiles from the client — role changes happen via the
-- Supabase dashboard or a future admin function.
alter table profiles enable row level security;
create policy "staff_read_profiles" on profiles for select
  using (auth.uid() is not null);

-- invoices: both roles read + create (treatments/plans generate invoices and
-- the front desk needs them); only the doctor edits or deletes an invoice.
-- paid_amount/status are trigger-managed (security definer) so a receptionist
-- recording a payment updates the invoice WITHOUT needing update rights here.
alter table invoices enable row level security;
create policy "staff_read_invoices" on invoices for select
  using (auth_role() in ('doctor', 'receptionist'));
create policy "staff_insert_invoices" on invoices for insert
  with check (auth_role() in ('doctor', 'receptionist'));
create policy "doctor_update_invoices" on invoices for update
  using (auth_role() = 'doctor') with check (auth_role() = 'doctor');
create policy "doctor_delete_invoices" on invoices for delete
  using (auth_role() = 'doctor');

-- membership_plans: pricing is the doctor's call; both roles can read plans
-- to enroll patients.
alter table membership_plans enable row level security;
create policy "staff_read_plans" on membership_plans for select
  using (auth_role() in ('doctor', 'receptionist'));
create policy "doctor_write_plans" on membership_plans for insert
  with check (auth_role() = 'doctor');
create policy "doctor_update_plans" on membership_plans for update
  using (auth_role() = 'doctor') with check (auth_role() = 'doctor');
create policy "doctor_delete_plans" on membership_plans for delete
  using (auth_role() = 'doctor');

-- audit_log: append-only. Both roles write entries; only the doctor reads
-- the trail; nobody updates or deletes (no policies = denied under RLS).
alter table audit_log enable row level security;
create policy "staff_insert_audit" on audit_log for insert
  with check (auth_role() in ('doctor', 'receptionist'));
create policy "doctor_read_audit" on audit_log for select
  using (auth_role() = 'doctor');
