-- DentSuite · Migration 0001 — initial schema
-- Mirrors the frontend data shapes in src/utils/mockData.js + ClinicContext.
-- Conventions: snake_case, uuid PKs, text statuses with CHECK constraints,
-- dates as `date` where the UI uses YYYY-MM-DD strings.

create extension if not exists "pgcrypto";

-- ── Identity ─────────────────────────────────────────────────────────────────
-- One row per auth user; `role` drives RLS (see migration 0002).
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('doctor', 'receptionist')),
  initials   text,
  created_at timestamptz not null default now()
);

-- ── Practice structure ───────────────────────────────────────────────────────
create table locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  phone      text,
  email      text,
  manager    text,
  chairs     int  not null default 1 check (chairs > 0),
  open_hours text,
  status     text not null default 'Active' check (status in ('Active', 'Inactive')),
  color      text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table staff (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null,
  specialty   text,
  email       text,
  phone       text,
  status      text not null default 'Active',
  joined_date date default current_date,
  location_id uuid references locations (id),
  created_at  timestamptz not null default now()
);

-- ── Patients ─────────────────────────────────────────────────────────────────
create table patients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  gender            text,
  dob               date,
  phone             text,
  email             text,
  address           text,
  allergies         text default 'None',
  status            text not null default 'Active'
                    check (status in ('Active', 'Pending Payment', 'Old Patients', 'Inactive')),
  registration_date date not null default current_date,
  blood_group       text,
  created_at        timestamptz not null default now()
);

create table appointments (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients (id) on delete cascade,
  dentist_id  uuid references staff (id),
  location_id uuid references locations (id),
  date        date not null,
  time        text,
  type        text,
  status      text not null default 'Scheduled'
              check (status in ('Scheduled', 'Arrived', 'In Progress', 'Completed', 'No Show', 'Cancelled')),
  notes       text,
  created_at  timestamptz not null default now()
);
create index on appointments (patient_id);
create index on appointments (date);

create table treatments (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  dentist_id   uuid references staff (id),
  date         date not null default current_date,
  type         text not null,
  tooth_number text default 'All',
  cost         numeric(12,2) not null check (cost >= 0),
  notes        text,
  created_at   timestamptz not null default now()
);
create index on treatments (patient_id);

-- ── Billing — the state machine lives HERE, enforced by the database ─────────
create table invoices (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients (id) on delete cascade,
  invoice_number text not null unique,
  date           date not null default current_date,
  due_date       date,
  total_amount   numeric(12,2) not null check (total_amount >= 0),
  paid_amount    numeric(12,2) not null default 0 check (paid_amount >= 0),
  balance_due    numeric(12,2) generated always as (total_amount - paid_amount) stored,
  status         text not null default 'Unpaid'
                 check (status in ('Unpaid', 'Partially Paid', 'Paid')),
  created_at     timestamptz not null default now(),
  constraint paid_never_exceeds_total check (paid_amount <= total_amount)
);
create index on invoices (patient_id);
create index on invoices (date);

create table payments (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  patient_id uuid not null references patients (id) on delete cascade,
  date       date not null default current_date,
  amount     numeric(12,2) not null check (amount > 0),
  method     text not null default 'Cash',
  created_at timestamptz not null default now()
);
create index on payments (invoice_id);
create index on payments (date);

-- Recalculate an invoice from its payments: paid_amount and the
-- Unpaid → Partially Paid → Paid status are ALWAYS derived, never hand-set.
create or replace function recalc_invoice(inv_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update invoices i
  set paid_amount = coalesce((select sum(p.amount) from payments p where p.invoice_id = inv_id), 0),
      status = case
        when coalesce((select sum(p.amount) from payments p where p.invoice_id = inv_id), 0) <= 0
          then 'Unpaid'
        when coalesce((select sum(p.amount) from payments p where p.invoice_id = inv_id), 0) >= i.total_amount
          then 'Paid'
        else 'Partially Paid'
      end
  where i.id = inv_id;
$$;

-- Guard: a payment may never overpay its invoice; also autofill patient_id.
create or replace function payments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining numeric;
begin
  select i.total_amount - i.paid_amount into remaining
  from invoices i where i.id = new.invoice_id for update;
  if remaining is null then
    raise exception 'Invoice % does not exist', new.invoice_id;
  end if;
  if new.amount > remaining then
    raise exception 'Payment of % exceeds remaining balance of %', new.amount, remaining;
  end if;
  if new.patient_id is null then
    select i.patient_id into new.patient_id from invoices i where i.id = new.invoice_id;
  end if;
  return new;
end;
$$;

create or replace function payments_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform recalc_invoice(coalesce(new.invoice_id, old.invoice_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_payments_before_insert
  before insert on payments
  for each row execute function payments_before_insert();

create trigger trg_payments_after_change
  after insert or update or delete on payments
  for each row execute function payments_after_change();

-- ── Reporting — buildPeriodSummary as a SQL function ─────────────────────────
-- granularity: 'day' | 'week' | 'month' | 'quarter'
create or replace function period_summary(granularity text, start_date date, end_date date)
returns table (
  period           timestamptz,
  appointments     bigint,
  revenue          numeric,
  billed           numeric,
  outstanding      numeric,
  invoice_count    bigint,
  paid_invoices    bigint,
  partial_invoices bigint,
  unpaid_invoices  bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
  if granularity not in ('day', 'week', 'month', 'quarter') then
    raise exception 'granularity must be day, week, month or quarter';
  end if;
  return query
  with appt as (
    select date_trunc(granularity, a.date::timestamptz) as p, count(*) as c
    from appointments a
    where a.date between start_date and end_date
    group by 1
  ),
  pay as (
    select date_trunc(granularity, pm.date::timestamptz) as p, sum(pm.amount) as rev
    from payments pm
    where pm.date between start_date and end_date
    group by 1
  ),
  inv as (
    select date_trunc(granularity, i.date::timestamptz) as p,
           sum(i.total_amount)                       as billed,
           sum(i.total_amount - i.paid_amount)       as outstanding,
           count(*)                                  as cnt,
           count(*) filter (where i.status = 'Paid')           as paid_c,
           count(*) filter (where i.status = 'Partially Paid') as part_c,
           count(*) filter (where i.status = 'Unpaid')         as unpaid_c
    from invoices i
    where i.date between start_date and end_date
    group by 1
  )
  select coalesce(appt.p, pay.p, inv.p)      as period,
         coalesce(appt.c, 0)                 as appointments,
         coalesce(pay.rev, 0)                as revenue,
         coalesce(inv.billed, 0)             as billed,
         coalesce(inv.outstanding, 0)        as outstanding,
         coalesce(inv.cnt, 0)                as invoice_count,
         coalesce(inv.paid_c, 0)             as paid_invoices,
         coalesce(inv.part_c, 0)             as partial_invoices,
         coalesce(inv.unpaid_c, 0)           as unpaid_invoices
  from appt
  full join pay on appt.p = pay.p
  full join inv on coalesce(appt.p, pay.p) = inv.p
  order by 1 desc;
end;
$$;

-- ── Clinical records ─────────────────────────────────────────────────────────
create table prescriptions (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  dentist_id uuid references staff (id),
  medication text not null,
  dosage     text,
  frequency  text,
  duration   text,
  date       date not null default current_date,
  status     text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);
create index on prescriptions (patient_id);

create table treatment_plans (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  dentist_id   uuid references staff (id),
  title        text not null,
  status       text not null default 'Proposed'
               check (status in ('Proposed', 'Accepted', 'In Progress', 'Completed')),
  created_date date not null default current_date,
  invoice_id   uuid references invoices (id),
  created_at   timestamptz not null default now()
);

create table plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references treatment_plans (id) on delete cascade,
  procedure    text not null,
  tooth_number text default '—',
  cost         numeric(12,2) not null default 0 check (cost >= 0),
  done         boolean not null default false
);
create index on plan_items (plan_id);

create table tooth_records (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  tooth_number int not null check (tooth_number between 1 and 32),
  status       text not null,
  surfaces     text default '',
  notes        text default '',
  updated_at   timestamptz not null default now(),
  unique (patient_id, tooth_number)
);

create table tooth_history (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  tooth_number int not null,
  prev_status  text,
  new_status   text not null,
  surfaces     text default '',
  notes        text default '',
  at           timestamptz not null default now()
);
create index on tooth_history (patient_id);

create table perio_entries (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  tooth_number int not null check (tooth_number between 1 and 32),
  depths       int[] not null default '{}',
  bop          boolean not null default false,
  updated_at   timestamptz not null default now(),
  unique (patient_id, tooth_number)
);

create table imaging_records (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  type         text not null,
  tooth_number text default 'All',
  date         date not null default current_date,
  taken_by     text,
  notes        text,
  storage_path text,
  created_at   timestamptz not null default now()
);
create index on imaging_records (patient_id);

create table lab_cases (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients (id) on delete cascade,
  dentist_id    uuid references staff (id),
  lab_name      text not null,
  case_type     text,
  tooth_number  text,
  status        text not null default 'Sent'
                check (status in ('Sent', 'In Progress', 'Received', 'Fitted')),
  cost          numeric(12,2) default 0,
  sent_date     date not null default current_date,
  due_date      date,
  received_date date,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── Engagement ───────────────────────────────────────────────────────────────
create table recalls (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references patients (id) on delete cascade,
  type             text not null,
  due_date         date,
  status           text not null default 'Pending'
                   check (status in ('Pending', 'Reminded', 'Completed', 'Dismissed')),
  channel          text not null default 'WhatsApp' check (channel in ('WhatsApp', 'SMS', 'Email')),
  notes            text,
  last_reminder_at date,
  created_at       timestamptz not null default now()
);
create index on recalls (patient_id);

create table booking_requests (
  id             uuid primary key default gen_random_uuid(),
  patient_name   text not null,
  phone          text,
  email          text,
  patient_id     uuid references patients (id),
  preferred_date date,
  preferred_time text,
  service        text,
  reason         text,
  status         text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Declined')),
  source         text default 'Online',
  submitted_date date not null default current_date,
  appointment_id uuid references appointments (id),
  created_at     timestamptz not null default now()
);

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  channel    text not null default 'WhatsApp' check (channel in ('WhatsApp', 'SMS')),
  unread     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (patient_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender          text not null check (sender in ('clinic', 'patient')),
  body            text not null,
  at              timestamptz not null default now()
);
create index on messages (conversation_id);

create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  channel      text not null default 'Email',
  segment      text not null,
  subject      text,
  body         text,
  status       text not null default 'Draft' check (status in ('Draft', 'Sent')),
  recipients   int not null default 0,
  created_date date not null default current_date,
  sent_at      date,
  created_at   timestamptz not null default now()
);

create table referrals (
  id           uuid primary key default gen_random_uuid(),
  direction    text not null check (direction in ('Inbound', 'Outbound')),
  patient_id   uuid references patients (id),
  patient_name text not null,
  provider     text,
  practice     text,
  specialty    text,
  reason       text,
  date         date not null default current_date,
  status       text not null default 'Pending'
               check (status in ('Pending', 'Contacted', 'Scheduled', 'Completed', 'Cancelled')),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ── Finance & admin ──────────────────────────────────────────────────────────
create table expenses (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  category    text not null,
  vendor      text,
  description text,
  amount      numeric(12,2) not null check (amount >= 0),
  method      text default 'Cash',
  status      text not null default 'Paid' check (status in ('Paid', 'Pending')),
  created_at  timestamptz not null default now()
);

create table claims (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients (id) on delete cascade,
  payer           text not null,
  policy_number   text,
  service_date    date,
  submitted_date  date not null default current_date,
  procedures      text,
  claimed_amount  numeric(12,2) not null default 0,
  approved_amount numeric(12,2) not null default 0,
  status          text not null default 'Submitted'
                  check (status in ('Draft', 'Submitted', 'In Review', 'Approved', 'Denied', 'Paid')),
  notes           text,
  created_at      timestamptz not null default now()
);

create table membership_plans (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  price      numeric(12,2) not null default 0,
  cycle      text not null default 'Annual' check (cycle in ('Monthly', 'Annual')),
  discount   int default 0,
  benefits   text,
  color      text,
  created_at timestamptz not null default now()
);

create table memberships (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients (id) on delete cascade,
  plan_id      uuid not null references membership_plans (id),
  start_date   date not null default current_date,
  renewal_date date,
  status       text not null default 'Active' check (status in ('Active', 'Paused', 'Cancelled')),
  price        numeric(12,2) default 0,
  created_at   timestamptz not null default now()
);

create table form_submissions (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references patients (id) on delete cascade,
  template_id    text not null,
  template_name  text not null,
  category       text,
  status         text not null default 'Pending' check (status in ('Pending', 'Completed')),
  sent_date      date not null default current_date,
  completed_date date,
  signed_by      text,
  signature_date date,
  created_at     timestamptz not null default now()
);

create table documents (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients (id) on delete cascade,
  name          text not null,
  category      text default 'Other',
  file_type     text,
  size          bigint default 0,
  storage_path  text,
  uploaded_date date not null default current_date,
  uploaded_by   text,
  notes         text,
  created_at    timestamptz not null default now()
);

create table inventory (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text,
  supplier      text,
  current_stock int not null default 0 check (current_stock >= 0),
  reorder_level int not null default 0,
  unit_price    numeric(12,2) default 0,
  status        text default 'In Stock',
  created_at    timestamptz not null default now()
);

-- Append-only activity trail (server timestamps — tamper-resistant).
create table audit_log (
  id        uuid primary key default gen_random_uuid(),
  at        timestamptz not null default now(),
  user_name text,
  module    text not null,
  action    text not null,
  detail    text
);
create index on audit_log (at desc);
