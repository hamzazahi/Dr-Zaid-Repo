-- ── 0008 Invoice waive / write-off ───────────────────────────────────────────
-- Lets a charge that should not be collected be marked "Waived" instead of
-- lingering as an unpaid balance forever - e.g. a consultation fee waived
-- because the treatment was done the same visit and the charge was already
-- generated. Waiving sets total_amount to 0 (so balance_due, a generated
-- column, becomes 0) and stamps status = 'Waived'.
--
-- Safe to run more than once.

-- 1. Allow the new terminal status.
alter table invoices drop constraint if exists invoices_status_check;
alter table invoices add constraint invoices_status_check
  check (status in ('Unpaid', 'Partially Paid', 'Paid', 'Waived'));

-- 2. Never let the payment-driven recalc overwrite a waived invoice. A waived
--    invoice has no payments, but this makes the terminal state robust.
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
  where i.id = inv_id
    and i.status <> 'Waived';
$$;
