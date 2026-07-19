-- DentSuite · Migration 0006 — inventory columns
-- The Inventory page tracks SKU and unit-of-measure; add them to the table.
-- Rerun-safe.

alter table inventory add column if not exists sku  text;
alter table inventory add column if not exists unit text default 'pcs';
