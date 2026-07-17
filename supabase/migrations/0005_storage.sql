-- DentSuite · Migration 0005 — file storage
-- Two private buckets + access policies that mirror the entity permissions:
--   documents : both roles upload/read/delete (front-desk paperwork)
--   imaging   : both roles read, only the doctor uploads/deletes (clinical)

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('imaging', 'imaging', false)
on conflict (id) do nothing;

-- documents bucket — full access for both staff roles
create policy "docs_staff_read" on storage.objects for select
  using (bucket_id = 'documents' and auth_role() in ('doctor', 'receptionist'));
create policy "docs_staff_insert" on storage.objects for insert
  with check (bucket_id = 'documents' and auth_role() in ('doctor', 'receptionist'));
create policy "docs_staff_delete" on storage.objects for delete
  using (bucket_id = 'documents' and auth_role() in ('doctor', 'receptionist'));

-- imaging bucket — read for both, writes are the doctor's
create policy "img_staff_read" on storage.objects for select
  using (bucket_id = 'imaging' and auth_role() in ('doctor', 'receptionist'));
create policy "img_doctor_insert" on storage.objects for insert
  with check (bucket_id = 'imaging' and auth_role() = 'doctor');
create policy "img_doctor_delete" on storage.objects for delete
  using (bucket_id = 'imaging' and auth_role() = 'doctor');
