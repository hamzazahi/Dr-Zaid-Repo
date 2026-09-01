-- ── 0009 Correct an invoice's paid amount ────────────────────────────────────
-- The doctor sometimes needs to fix what a patient has actually paid: a
-- receipt typed as 5,000 instead of 500, or cash counted twice. paid_amount is
-- derived from the payments ledger (see recalc_invoice), so it must never be
-- hand-written on the invoice row - that would silently desync the ledger the
-- Payments page and the patient's history are built from.
--
-- This RPC reconciles the LEDGER to the corrected total instead: top it up
-- with one adjustment payment when the amount goes up, and trim the newest
-- payments when it goes down. The existing triggers then recalculate
-- paid_amount, balance_due and status, so the balance always reflects the
-- edit.
--
-- Safe to run more than once.

create or replace function set_invoice_paid_amount(
  inv_id   uuid,
  new_paid numeric,
  method   text default 'Adjustment'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv     invoices%rowtype;
  target  numeric;
  excess  numeric;
  r       record;
begin
  -- Correcting money is the doctor's call, same as the invoice update policy
  -- in 0002. This function is security definer (it has to be, to touch the
  -- trigger-managed ledger), so the check has to live here. A call with no
  -- JWT is a server-side/admin one and is left alone.
  if auth.uid() is not null and auth_role() is distinct from 'doctor' then
    raise exception 'Only the doctor can correct an invoice paid amount';
  end if;

  select * into inv from invoices where id = inv_id for update;
  if not found then
    raise exception 'Invoice % does not exist', inv_id;
  end if;
  if inv.status = 'Waived' then
    raise exception 'Invoice % is waived and cannot be edited', inv.invoice_number;
  end if;

  target := round(coalesce(new_paid, 0), 2);
  if target < 0 then
    raise exception 'Paid amount cannot be negative';
  end if;
  if target > inv.total_amount then
    raise exception 'Paid amount % exceeds the invoice total of %', target, inv.total_amount;
  end if;

  if target > inv.paid_amount then
    -- Going up: one adjustment payment for the difference.
    insert into payments (invoice_id, patient_id, amount, method)
    values (inv_id, inv.patient_id, target - inv.paid_amount, coalesce(method, 'Adjustment'));

  elsif target < inv.paid_amount then
    -- Going down: retire the newest payments until the ledger matches. A
    -- payment that is only partly over the line is reduced, not deleted, so
    -- the earlier history stays intact.
    excess := inv.paid_amount - target;
    for r in
      select id, amount from payments
      where invoice_id = inv_id
      order by date desc, created_at desc
    loop
      exit when excess <= 0;
      if r.amount <= excess then
        delete from payments where id = r.id;
        excess := excess - r.amount;
      else
        update payments set amount = r.amount - excess where id = r.id;
        excess := 0;
      end if;
    end loop;
  end if;

  -- The payment triggers already recalculated the invoice; this covers the
  -- no-op case and any invoice whose stored status drifted.
  perform recalc_invoice(inv_id);
end;
$$;

grant execute on function set_invoice_paid_amount(uuid, numeric, text) to authenticated;
