-- ── 0011 Installment payment plans ───────────────────────────────────────────
-- Implants and orthodontic cases are the two treatments patients pay off over
-- months, and until now the system could not express that: every invoice was
-- due 14 days after acceptance, and while an invoice could be part-paid, there
-- was nothing to say WHEN each part was expected.
--
-- The design keeps the billing state machine as the single source of truth:
--
--   * A schedule is a PLAN, not a second ledger. The money stays in `payments`
--     against the invoice exactly as before. An installment row records what is
--     expected and when, and nothing else - no amount paid, no status.
--   * Everything else is DERIVED. Whether an installment is paid, part paid or
--     overdue is a function of what is expected by that date, what the invoice
--     has actually received, and today. See src/utils/paymentPlan.js.
--
-- That means collecting an installment is just the ordinary Collect flow, and
-- the paid-amount correction from 0009 keeps working untouched.
--
-- No interest or mark-up: installments always sum to exactly the invoice total.
--
-- Safe to run more than once.

create table if not exists payment_schedules (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null unique references invoices (id) on delete cascade,
  patient_id     uuid not null references patients (id) on delete cascade,
  category       text not null default 'General'
                 check (category in ('General', 'Implant', 'Ortho')),
  total_amount   numeric(12,2) not null check (total_amount >= 0),
  down_payment   numeric(12,2) not null default 0 check (down_payment >= 0),
  first_due_date date not null,
  frequency      text not null default 'Monthly' check (frequency in ('Monthly')),
  status         text not null default 'Active'
                 check (status in ('Active', 'Completed', 'Cancelled')),
  notes          text,
  created_at     timestamptz not null default now(),
  constraint down_payment_within_total check (down_payment <= total_amount)
);
create index if not exists payment_schedules_patient_idx on payment_schedules (patient_id);

create table if not exists schedule_installments (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references payment_schedules (id) on delete cascade,
  seq         integer not null check (seq > 0),
  due_date    date not null,
  amount      numeric(12,2) not null check (amount > 0),
  unique (schedule_id, seq)
);
create index if not exists schedule_installments_due_idx on schedule_installments (due_date);

-- ── Row-level security ───────────────────────────────────────────────────────
-- Both roles READ: the front desk has to know who owes what this month.
-- Only the DOCTOR writes: agreeing to spread a fee over months is a commercial
-- decision, the same call as waiving a charge or correcting an invoice.
alter table payment_schedules enable row level security;
alter table schedule_installments enable row level security;

drop policy if exists "staff_read_schedules" on payment_schedules;
create policy "staff_read_schedules" on payment_schedules for select
  using (auth_role() in ('doctor', 'receptionist'));
drop policy if exists "doctor_insert_schedules" on payment_schedules;
create policy "doctor_insert_schedules" on payment_schedules for insert
  with check (auth_role() = 'doctor');
drop policy if exists "doctor_update_schedules" on payment_schedules;
create policy "doctor_update_schedules" on payment_schedules for update
  using (auth_role() = 'doctor') with check (auth_role() = 'doctor');
drop policy if exists "doctor_delete_schedules" on payment_schedules;
create policy "doctor_delete_schedules" on payment_schedules for delete
  using (auth_role() = 'doctor');

drop policy if exists "staff_read_installments" on schedule_installments;
create policy "staff_read_installments" on schedule_installments for select
  using (auth_role() in ('doctor', 'receptionist'));
drop policy if exists "doctor_insert_installments" on schedule_installments;
create policy "doctor_insert_installments" on schedule_installments for insert
  with check (auth_role() = 'doctor');
drop policy if exists "doctor_update_installments" on schedule_installments;
create policy "doctor_update_installments" on schedule_installments for update
  using (auth_role() = 'doctor') with check (auth_role() = 'doctor');
drop policy if exists "doctor_delete_installments" on schedule_installments;
create policy "doctor_delete_installments" on schedule_installments for delete
  using (auth_role() = 'doctor');

-- Live sync, matching how the other tables are published (0003 / 0004).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table payment_schedules;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table schedule_installments;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
