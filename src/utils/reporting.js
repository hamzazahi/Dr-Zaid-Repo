// Centralised reporting service.
//
// Aggregates appointments, invoices and payments into period buckets at a
// chosen granularity (daily / weekly / monthly / quarterly). Every entity is
// bucketed by its own date, so a single period row reflects the appointments
// booked, the revenue collected, the amount billed and the outstanding dues
// for that span — plus a full-vs-partial-vs-unpaid invoice breakdown.

import { computeInvoiceStatus, INVOICE_STATUS } from './billing.js';

export const GRANULARITIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value).split('T')[0]);
  return Number.isNaN(d.getTime()) ? null : d;
};

const pad = (n) => String(n).padStart(2, '0');

// ISO-8601 week number + ISO week-year (weeks start Monday; week 1 contains
// the first Thursday of the year).
const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
};

// Map a date to a stable bucket: a sort key, a display label, and a coarse key.
const bucketFor = (granularity, date) => {
  switch (granularity) {
    case 'Daily': {
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      return { key, sort: key, label: `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` };
    }
    case 'Weekly': {
      const { year, week } = isoWeek(date);
      return { key: `${year}-W${pad(week)}`, sort: `${year}-${pad(week)}`, label: `Week ${week}, ${year}` };
    }
    case 'Quarterly': {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return { key: `${date.getFullYear()}-Q${q}`, sort: `${date.getFullYear()}-${q}`, label: `Q${q} ${date.getFullYear()}` };
    }
    case 'Monthly':
    default: {
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      return { key, sort: key, label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}` };
    }
  }
};

const emptyBucket = (meta) => ({
  key: meta.key,
  label: meta.label,
  sort: meta.sort,
  appointments: 0,
  revenue: 0,
  billed: 0,
  outstanding: 0,
  invoiceCount: 0,
  paidInvoices: 0,
  partialInvoices: 0,
  unpaidInvoices: 0,
});

const inRange = (date, start, end) => {
  if (!date) return false;
  const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (start && iso < start) return false;
  if (end && iso > end) return false;
  return true;
};

// Build the per-period summary. `range` is an optional { start, end } pair of
// YYYY-MM-DD strings; entities outside the range are ignored.
export const buildPeriodSummary = (
  { appointments = [], invoices = [], payments = [] },
  granularity = 'Monthly',
  range = {},
) => {
  const { start, end } = range;
  const buckets = new Map();

  const ensure = (date) => {
    const meta = bucketFor(granularity, date);
    if (!buckets.has(meta.key)) buckets.set(meta.key, emptyBucket(meta));
    return buckets.get(meta.key);
  };

  appointments.forEach((a) => {
    const d = parseDate(a.date);
    if (!inRange(d, start, end)) return;
    ensure(d).appointments += 1;
  });

  payments.forEach((p) => {
    const d = parseDate(p.date);
    if (!inRange(d, start, end)) return;
    ensure(d).revenue += Number(p.amount) || 0;
  });

  invoices.forEach((inv) => {
    const d = parseDate(inv.date);
    if (!inRange(d, start, end)) return;
    const bucket = ensure(d);
    const total = Number(inv.totalAmount) || 0;
    const paid = Number(inv.paidAmount) || 0;
    bucket.billed += total;
    bucket.outstanding += Math.max(0, total - paid);
    bucket.invoiceCount += 1;
    const status = computeInvoiceStatus(total, paid);
    if (status === INVOICE_STATUS.PAID) bucket.paidInvoices += 1;
    else if (status === INVOICE_STATUS.PARTIAL) bucket.partialInvoices += 1;
    else bucket.unpaidInvoices += 1;
  });

  return Array.from(buckets.values()).sort((a, b) => (a.sort < b.sort ? 1 : -1));
};

// Roll a list of period buckets up into a single totals row.
export const totalsFromBuckets = (buckets = []) =>
  buckets.reduce(
    (acc, b) => ({
      appointments: acc.appointments + b.appointments,
      revenue: acc.revenue + b.revenue,
      billed: acc.billed + b.billed,
      outstanding: acc.outstanding + b.outstanding,
      invoiceCount: acc.invoiceCount + b.invoiceCount,
      paidInvoices: acc.paidInvoices + b.paidInvoices,
      partialInvoices: acc.partialInvoices + b.partialInvoices,
      unpaidInvoices: acc.unpaidInvoices + b.unpaidInvoices,
    }),
    {
      appointments: 0, revenue: 0, billed: 0, outstanding: 0,
      invoiceCount: 0, paidInvoices: 0, partialInvoices: 0, unpaidInvoices: 0,
    },
  );
