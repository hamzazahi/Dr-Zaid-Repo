-- ── 0010 Treatment plan categories (Implant / Ortho) ─────────────────────────
-- Implant and orthodontic cases do not behave like the restorative work the
-- plan module was built for: they run in an ORDER, and parts of that order are
-- biological waits rather than procedures (osseointegration, healing after a
-- graft). A flat unordered checklist cannot express either.
--
-- Three additions, all with defaults, so every existing plan keeps working
-- exactly as it does today:
--   treatment_plans.category   'General' | 'Implant' | 'Ortho'
--   plan_items.sort_order      the stage sequence (items had NO ordering)
--   plan_items.kind            'procedure' | 'wait'
--
-- Safe to run more than once.

-- 1. The category. Existing plans become 'General' and are otherwise untouched.
alter table treatment_plans add column if not exists category text not null default 'General';
alter table treatment_plans drop constraint if exists treatment_plans_category_check;
alter table treatment_plans add constraint treatment_plans_category_check
  check (category in ('General', 'Implant', 'Ortho'));
create index if not exists treatment_plans_category_idx on treatment_plans (category);

-- 2. Stage order. Until now plan_items came back in whatever order Postgres
--    chose, which is harmless for a checklist and wrong for a sequence.
alter table plan_items add column if not exists sort_order integer not null default 0;

-- 3. A wait is not a procedure: it is charted when healing is confirmed, and
--    it is never part of the fee. Kept as a column rather than a naming
--    convention so the UI and any future reporting can tell them apart.
alter table plan_items add column if not exists kind text not null default 'procedure';
alter table plan_items drop constraint if exists plan_items_kind_check;
alter table plan_items add constraint plan_items_kind_check
  check (kind in ('procedure', 'wait'));

-- Backfill a stable order for plans created before this migration, so their
-- items stop shuffling between loads. Ordering by id is arbitrary but fixed.
with ordered as (
  select id, row_number() over (partition by plan_id order by id) as rn
  from plan_items
)
update plan_items pi
set sort_order = ordered.rn
from ordered
where ordered.id = pi.id
  and pi.sort_order = 0;
