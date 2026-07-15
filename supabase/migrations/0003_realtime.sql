-- DentSuite · Migration 0003 — realtime on the clinical core
-- Adds the core tables to Supabase's realtime publication so a change made on
-- one device (or by a payment webhook later) appears on every screen live.
-- Each table is added in its own guarded block so re-runs are harmless.

do $$
declare
  t text;
begin
  foreach t in array array['patients', 'staff', 'appointments', 'treatments', 'invoices', 'payments'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then
      raise notice 'table % already in publication', t;
    end;
  end loop;
end $$;
