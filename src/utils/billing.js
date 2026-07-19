// Centralised billing state machine.
//
// Every invoice has exactly one of three statuses, derived purely from
// (totalAmount, paidAmount). Status is NEVER set by hand anywhere else -
// always run an invoice through `recalcInvoice` so the balance, status and
// payment percentage stay in lock‑step. This is the single source of truth
// for the Unpaid → Partially Paid → Fully Paid lifecycle.

export const INVOICE_STATUS = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially Paid',
  PAID: 'Paid',
};

// Human-facing labels. The stored status keeps the short canonical value
// ('Paid') for backward compatibility with existing data and filters, while
// the UI can show the friendlier "Fully Paid".
export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUS.UNPAID]: 'Unpaid',
  [INVOICE_STATUS.PARTIAL]: 'Partially Paid',
  [INVOICE_STATUS.PAID]: 'Fully Paid',
};

export const invoiceStatusLabel = (status) =>
  INVOICE_STATUS_LABELS[status] || status;

const toAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// The core state-machine transition: given a total and the amount paid so far,
// decide which state the invoice is in.
export const computeInvoiceStatus = (totalAmount, paidAmount) => {
  const total = toAmount(totalAmount);
  const paid = toAmount(paidAmount);
  if (paid <= 0) return INVOICE_STATUS.UNPAID;
  if (paid >= total) return INVOICE_STATUS.PAID;
  return INVOICE_STATUS.PARTIAL;
};

// Recalculate every derived field on an invoice from its amounts. Pass
// `paidOverride` to apply a new paid total (e.g. after recording a payment);
// otherwise the invoice's own `paidAmount` is used. Paid is always clamped to
// the range [0, total] so an overpayment can never corrupt the balance.
export const recalcInvoice = (invoice, paidOverride) => {
  const total = toAmount(invoice.totalAmount);
  const rawPaid = toAmount(paidOverride ?? invoice.paidAmount);
  const paidAmount = Math.min(total, Math.max(0, rawPaid));
  const balanceDue = Math.max(0, total - paidAmount);
  const status = computeInvoiceStatus(total, paidAmount);
  const paymentPercentage = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
  return { ...invoice, totalAmount: total, paidAmount, balanceDue, status, paymentPercentage };
};

// Aggregate counts/totals across a set of invoices, grouped by status.
export const summariseInvoices = (invoices = []) => {
  const summary = {
    total: 0,
    collected: 0,
    outstanding: 0,
    count: invoices.length,
    unpaidCount: 0,
    partialCount: 0,
    paidCount: 0,
  };
  invoices.forEach((inv) => {
    const total = toAmount(inv.totalAmount);
    const paid = toAmount(inv.paidAmount);
    summary.total += total;
    summary.collected += paid;
    summary.outstanding += Math.max(0, total - paid);
    const status = computeInvoiceStatus(total, paid);
    if (status === INVOICE_STATUS.PAID) summary.paidCount += 1;
    else if (status === INVOICE_STATUS.PARTIAL) summary.partialCount += 1;
    else summary.unpaidCount += 1;
  });
  return summary;
};
