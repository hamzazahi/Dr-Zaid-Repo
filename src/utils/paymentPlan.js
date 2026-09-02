// Installment payment plans - the arithmetic, in one place.
//
// The clinic sells an implant or an ortho case for a fixed fee and lets the
// patient pay it off over months. This module turns "Rs 150,000, Rs 30,000 down,
// 8 months" into dated installments, and works out where a plan stands once
// payments start arriving.
//
// TWO RULES HOLD THIS TOGETHER, and both mirror how billing already works:
//
//   1. A schedule is a PLAN, never a second ledger. The money itself stays in
//      the payments table against the invoice, exactly as before - an
//      installment records what is *expected* and when, and nothing else. So
//      "how much has this patient paid" has one answer, the invoice's, and
//      collecting an installment is just the ordinary Collect flow.
//
//   2. Status is DERIVED, never stored. An installment is Paid, Partly paid,
//      Due or Overdue purely as a function of (what is expected by then, what
//      the invoice has actually received, today's date).
//
// No interest or mark-up is applied: the cash price is split, and the
// installments always add back up to exactly the invoice total.

export const SCHEDULE_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const INSTALLMENT_STATE = {
  PAID: 'Paid',
  PARTIAL: 'Partly paid',
  DUE: 'Due',
  OVERDUE: 'Overdue',
};

const toAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Whole rupees. Fractions of a rupee in a payment plan are noise the front
// desk cannot collect anyway.
const round = (n) => Math.round(toAmount(n));

const isoDate = (d) => d.toISOString().split('T')[0];

// Add whole months, clamping to the end of a shorter month so a plan starting
// on the 31st does not skip February.
export const addMonths = (dateStr, months) => {
  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) return dateStr;
  const day = base.getDate();
  const shifted = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(day, lastDay));
  return isoDate(shifted);
};

// Build the installments for a plan.
//
// Give EITHER a count (how many months) OR an amount (how much per month) -
// whichever the doctor and patient agreed on - and the other is derived. The
// final installment absorbs the rounding remainder so the schedule always sums
// to exactly the amount being financed, never a rupee more or less.
export const buildSchedule = ({ total, downPayment = 0, firstDueDate, count, amount }) => {
  const totalAmount = round(total);
  const down = Math.min(Math.max(0, round(downPayment)), totalAmount);
  const financed = totalAmount - down;

  if (financed <= 0) {
    return { total: totalAmount, downPayment: down, financed: 0, installments: [] };
  }

  let n;
  if (count != null && count !== '') {
    n = Math.max(1, Math.floor(Number(count) || 0));
  } else {
    const per = round(amount);
    if (per <= 0) return { total: totalAmount, downPayment: down, financed, installments: [] };
    n = Math.max(1, Math.ceil(financed / per));
  }

  const per = Math.floor(financed / n);
  const installments = [];
  let allocated = 0;
  for (let i = 0; i < n; i += 1) {
    const last = i === n - 1;
    const value = last ? financed - allocated : per;
    allocated += value;
    installments.push({
      seq: i + 1,
      dueDate: addMonths(firstDueDate, i),
      amount: value,
    });
  }
  return { total: totalAmount, downPayment: down, financed, installments };
};

// Where does the plan stand? `paidAmount` is the invoice's own figure - the
// single source of truth for money received.
//
// Payments are applied to installments in order, oldest first, which is how a
// front desk reasons about a payment plan: money that arrives clears the
// earliest thing still owed.
export const summariseSchedule = (schedule, paidAmount, todayStr) => {
  const paid = round(paidAmount);
  const today = todayStr || isoDate(new Date());
  const down = round(schedule?.downPayment);
  const installments = schedule?.installments ?? [];

  // The down payment is settled first.
  let remaining = Math.max(0, paid - down);
  const downPaid = Math.min(paid, down);

  let nextDue = null;
  let overdueAmount = 0;
  let scheduledTotal = down;

  const rows = installments.map((inst) => {
    const amount = round(inst.amount);
    scheduledTotal += amount;
    const covered = Math.min(remaining, amount);
    remaining -= covered;
    const outstanding = amount - covered;

    let state;
    if (outstanding <= 0) state = INSTALLMENT_STATE.PAID;
    else if (inst.dueDate < today) state = INSTALLMENT_STATE.OVERDUE;
    else if (covered > 0) state = INSTALLMENT_STATE.PARTIAL;
    else state = INSTALLMENT_STATE.DUE;

    if (state === INSTALLMENT_STATE.OVERDUE) overdueAmount += outstanding;
    if (outstanding > 0 && !nextDue) nextDue = { ...inst, amount, outstanding, state };

    return { ...inst, amount, paidAmount: covered, outstanding, state };
  });

  const outstandingTotal = Math.max(0, scheduledTotal - paid);
  return {
    rows,
    downPayment: down,
    downPaid,
    downOutstanding: Math.max(0, down - downPaid),
    scheduledTotal,
    paid: Math.min(paid, scheduledTotal),
    outstanding: outstandingTotal,
    overdue: overdueAmount,
    nextDue,
    complete: outstandingTotal <= 0,
  };
};

// What falls due in a given month, across every active plan - the front desk's
// "who owes us this month" question.
export const dueInMonth = (summaries, monthStr) => {
  const month = monthStr || isoDate(new Date()).slice(0, 7);
  return summaries.reduce(
    (acc, s) => {
      s.rows.forEach((r) => {
        if (r.dueDate.slice(0, 7) === month && r.outstanding > 0) {
          acc.count += 1;
          acc.amount += r.outstanding;
        }
      });
      return acc;
    },
    { count: 0, amount: 0 },
  );
};
