-- DentSuite · Migration 0004 — realtime on all remaining tables
-- Completes what 0003 started: every entity now pushes live changes to
-- connected devices. Guarded per table; safe to re-run.

do $$
declare
  t text;
begin
  foreach t in array array[
    'prescriptions', 'treatment_plans', 'plan_items', 'lab_cases', 'recalls',
    'documents', 'expenses', 'claims', 'booking_requests', 'membership_plans',
    'memberships', 'form_submissions', 'campaigns', 'referrals',
    'imaging_records', 'locations', 'conversations', 'messages',
    'tooth_records', 'tooth_history', 'perio_entries', 'audit_log'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then
      raise notice 'table % already in publication', t;
    end;
  end loop;
end $$;
