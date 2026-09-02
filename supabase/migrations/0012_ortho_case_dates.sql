-- ── 0012 Ortho case dates ────────────────────────────────────────────────────
-- Established practice management systems model an orthodontic case as a SPAN,
-- not a checklist: the banding date (when the appliance went on) and the
-- expected debond date (when it should come off). Standard billing carries the
-- same two facts as "Date Appliance Placed" and "Months of Treatment".
--
-- Storing the two dates means the months of treatment, how far through the case
-- is, and how many monthly adjustment visits to expect are all derived - never
-- re-entered, and never able to drift out of agreement with the dates.
--
-- Both columns are nullable and only meaningful on a category = 'Ortho' plan,
-- so nothing existing is affected.
--
-- Safe to run more than once.

alter table treatment_plans add column if not exists banding_date date;
alter table treatment_plans add column if not exists debond_date  date;

-- A case cannot come off before it goes on.
alter table treatment_plans drop constraint if exists treatment_plans_debond_after_banding;
alter table treatment_plans add constraint treatment_plans_debond_after_banding
  check (banding_date is null or debond_date is null or debond_date >= banding_date);
