-- ── 0013 Phase-by-phase billing ──────────────────────────────────────────────
-- Accepting a plan billed the WHOLE case in one invoice, due in 14 days. For a
-- filling that is right. For an implant or an ortho case it is not: the patient
-- is usually agreeing to the first stage, not committing to every stage months
-- before it happens, and phased planning - present a case in named phases and
-- let the patient accept one at a time - is the norm elsewhere.
--
-- Two additions, both defaulting so existing plans keep their exact behaviour:
--
--   plan_items.phase   which phase a stage belongs to (everything starts in 1)
--   plan_phases        the phase's name and, once billed, its own invoice
--
-- A single-phase plan behaves precisely as before: accepting it raises one
-- invoice for the lot. A multi-phase plan raises one invoice per phase, as and
-- when each is accepted, each through the same billing state machine.
--
-- Safe to run more than once.

alter table plan_items add column if not exists phase integer not null default 1;
alter table plan_items drop constraint if exists plan_items_phase_check;
alter table plan_items add constraint plan_items_phase_check check (phase > 0);

create table if not exists plan_phases (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references treatment_plans (id) on delete cascade,
  phase      integer not null check (phase > 0),
  name       text,
  -- Set when this phase is accepted and billed. Null means not yet billed.
  invoice_id uuid references invoices (id),
  created_at timestamptz not null default now(),
  unique (plan_id, phase)
);
create index if not exists plan_phases_plan_idx on plan_phases (plan_id);

-- ── Row-level security ───────────────────────────────────────────────────────
-- Matches treatment_plans in 0002: clinical records are read by both roles and
-- written by the doctor.
alter table plan_phases enable row level security;

drop policy if exists "staff_read_plan_phases" on plan_phases;
create policy "staff_read_plan_phases" on plan_phases for select
  using (auth_role() in ('doctor', 'receptionist'));
drop policy if exists "doctor_insert_plan_phases" on plan_phases;
create policy "doctor_insert_plan_phases" on plan_phases for insert
  with check (auth_role() = 'doctor');
drop policy if exists "doctor_update_plan_phases" on plan_phases;
create policy "doctor_update_plan_phases" on plan_phases for update
  using (auth_role() = 'doctor') with check (auth_role() = 'doctor');
drop policy if exists "doctor_delete_plan_phases" on plan_phases;
create policy "doctor_delete_plan_phases" on plan_phases for delete
  using (auth_role() = 'doctor');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table plan_phases;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
