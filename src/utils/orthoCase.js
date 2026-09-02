// Orthodontic cases - the two dates everything else derives from.
//
// Established practice management systems model an ortho case as a span, not a
// checklist: the BANDING DATE (when the appliance went on) and the EXPECTED
// DEBOND DATE (when it should come off). Standard billing carries the same two
// facts as "Date Appliance Placed" and "Months of Treatment".
//
// Everything a clinic wants to know follows from that span - how long the case
// runs, how far through it is, how many monthly adjustment visits to expect -
// so none of it is re-entered, and none of it can drift out of agreement with
// the dates.

export const ORTHO_PHASE = {
  PLANNED: 'Not started',
  ACTIVE: 'In treatment',
  DUE: 'Due for debond',
  DONE: 'Debonded',
};

const parse = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Whole months between two dates, rounded to the nearest month - a case is
// discussed as "about 18 months", never as 547 days.
export const monthsBetween = (fromStr, toStr) => {
  const from = parse(fromStr);
  const to = parse(toStr);
  if (!from || !to) return 0;
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  const dayAdjust = to.getDate() >= from.getDate() ? 0 : -1;
  return months + dayAdjust;
};

// Where an ortho case stands. `completed` lets a plan that has been charted all
// the way through read as Debonded even if the expected date has not arrived.
export const orthoCaseProgress = ({ bandingDate, debondDate }, todayStr, completed = false) => {
  if (!bandingDate || !debondDate) return null;
  const today = todayStr || new Date().toISOString().split('T')[0];

  const totalMonths = Math.max(0, monthsBetween(bandingDate, debondDate));
  const elapsedMonths = Math.max(0, monthsBetween(bandingDate, today));
  const remainingMonths = Math.max(0, totalMonths - elapsedMonths);

  let phase;
  if (completed) phase = ORTHO_PHASE.DONE;
  else if (today < bandingDate) phase = ORTHO_PHASE.PLANNED;
  else if (today > debondDate) phase = ORTHO_PHASE.DUE;
  else phase = ORTHO_PHASE.ACTIVE;

  const percent = totalMonths > 0
    ? Math.min(100, Math.max(0, Math.round((elapsedMonths / totalMonths) * 100)))
    : 0;

  return {
    totalMonths,
    elapsedMonths: Math.min(elapsedMonths, totalMonths),
    remainingMonths,
    percent: phase === ORTHO_PHASE.DONE ? 100 : percent,
    phase,
    // One adjustment visit a month for the life of the case - the recurring
    // core of ortho treatment, and usually when the installment is collected.
    expectedVisits: totalMonths,
    visitsSoFar: Math.min(Math.max(0, elapsedMonths), totalMonths),
    overdueForDebond: phase === ORTHO_PHASE.DUE,
  };
};

// A sensible expected debond date when the doctor has not set one: the typical
// 18 months of fixed appliance treatment from banding.
export const DEFAULT_ORTHO_MONTHS = 18;

export const defaultDebondDate = (bandingDate, months = DEFAULT_ORTHO_MONTHS) => {
  const from = parse(bandingDate);
  if (!from) return '';
  const to = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const lastDay = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
  to.setDate(Math.min(from.getDate(), lastDay));
  return to.toISOString().split('T')[0];
};
