// DentIQ - the practice-intelligence engine.
//
// Pure functions over clinic data: no network, no side effects. Today the
// intelligence is deterministic rules (transparent and explainable); in the
// backend phase the same interfaces can be served by cloud AI models
// (X-ray analysis, LLM answers) without touching the UI.

const DAY = 86400000;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysAgo = (dateStr) => {
  if (!dateStr) return Infinity;
  const d = new Date(String(dateStr).split('T')[0]);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / DAY);
};

const daysUntil = (dateStr) => -daysAgo(dateStr);

const rs = (n) => `Rs ${Math.round(Number(n) || 0).toLocaleString()}`;

// ── No-show risk scoring ─────────────────────────────────────────────────────
// A patient with prior no-shows who has an upcoming appointment is a
// reminder-worthy risk. Score = past no-shows (capped), returned per upcoming
// appointment so the front desk can act on each one.
export const findNoShowRisks = ({ appointments = [] }) => {
  const t = todayStr();
  const noShowCounts = {};
  appointments.forEach((a) => {
    if (a.status === 'No Show') noShowCounts[a.patientId] = (noShowCounts[a.patientId] || 0) + 1;
  });
  return appointments
    .filter((a) => a.date >= t && (a.status === 'Scheduled' || a.status === 'Arrived') && noShowCounts[a.patientId])
    .map((a) => ({
      appointmentId: a.id,
      patientId: a.patientId,
      patientName: a.patientName,
      date: a.date,
      time: a.time,
      priorNoShows: noShowCounts[a.patientId],
      risk: noShowCounts[a.patientId] >= 2 ? 'High' : 'Medium',
    }));
};

// ── Insight feed ─────────────────────────────────────────────────────────────
// Returns prioritized, actionable insights. severity: critical > warning >
// info > positive. Every insight says WHY (the evidence) and offers an action.
export const buildInsights = (data) => {
  const {
    patients = [], appointments = [], invoices = [], payments = [],
    recalls = [], labCases = [], claims = [], memberships = [], formSubmissions = [],
  } = data;
  const t = todayStr();
  const insights = [];

  // 1 · Overdue invoices (money already earned, not collected)
  const overdueInvoices = invoices.filter((i) => (i.balanceDue || 0) > 0 && i.dueDate && i.dueDate < t);
  if (overdueInvoices.length) {
    const total = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);
    const top = [...overdueInvoices].sort((a, b) => b.balanceDue - a.balanceDue)[0];
    insights.push({
      id: 'overdue-invoices', severity: 'critical', category: 'Revenue',
      title: `${rs(total)} overdue across ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''}`,
      detail: `Largest: ${top.patientName} owes ${rs(top.balanceDue)} (${top.invoiceNumber}). Send payment links or collect at the next visit.`,
      action: { label: 'Open Billing', path: '/billing' },
    });
  }

  // 2 · No-show risk on upcoming appointments
  const risks = findNoShowRisks({ appointments });
  if (risks.length) {
    const high = risks.filter((r) => r.risk === 'High').length;
    insights.push({
      id: 'no-show-risk', severity: 'warning', category: 'Schedule',
      title: `${risks.length} upcoming appointment${risks.length > 1 ? 's' : ''} at no-show risk`,
      detail: `${risks.map((r) => r.patientName).slice(0, 3).join(', ')}${risks.length > 3 ? '…' : ''} missed appointments before${high ? ` (${high} high-risk)` : ''}. A reminder cuts no-shows sharply.`,
      action: { label: 'Open Recalls', path: '/recalls' },
    });
  }

  // 3 · Overdue recalls
  const overdueRecalls = recalls.filter((r) => r.dueDate && r.dueDate < t && (r.status === 'Pending' || r.status === 'Reminded'));
  if (overdueRecalls.length) {
    insights.push({
      id: 'overdue-recalls', severity: 'warning', category: 'Recalls',
      title: `${overdueRecalls.length} recall${overdueRecalls.length > 1 ? 's are' : ' is'} overdue`,
      detail: `${overdueRecalls.map((r) => r.patientName).slice(0, 3).join(', ')}${overdueRecalls.length > 3 ? '…' : ''} - overdue patients drift to other clinics if not re-engaged.`,
      action: { label: 'Open Recalls', path: '/recalls' },
    });
  }

  // 4 · Dormant patients (no visit in 6+ months, nothing scheduled, no recall)
  const lastVisit = {};
  appointments.forEach((a) => {
    if (a.date <= t && (!lastVisit[a.patientId] || a.date > lastVisit[a.patientId])) lastVisit[a.patientId] = a.date;
  });
  const hasUpcoming = new Set(appointments.filter((a) => a.date > t).map((a) => a.patientId));
  const hasOpenRecall = new Set(recalls.filter((r) => r.status === 'Pending' || r.status === 'Reminded').map((r) => r.patientId));
  const dormant = patients.filter((p) =>
    !hasUpcoming.has(p.id) && !hasOpenRecall.has(p.id) &&
    (lastVisit[p.id] ? daysAgo(lastVisit[p.id]) > 180 : daysAgo(p.registrationDate) > 180)
  );
  if (dormant.length) {
    insights.push({
      id: 'dormant-patients', severity: 'info', category: 'Growth',
      title: `${dormant.length} patient${dormant.length > 1 ? 's' : ''} inactive for 6+ months`,
      detail: `${dormant.map((p) => p.name).slice(0, 3).join(', ')}${dormant.length > 3 ? '…' : ''} have no upcoming visit or open recall. Schedule recalls or target them with a campaign.`,
      action: { label: 'Create Recalls', path: '/recalls' },
    });
  }

  // 5 · Overdue lab cases
  const lateLab = labCases.filter((c) => c.dueDate && c.dueDate < t && (c.status === 'Sent' || c.status === 'In Progress'));
  if (lateLab.length) {
    insights.push({
      id: 'late-lab', severity: 'warning', category: 'Clinical',
      title: `${lateLab.length} lab case${lateLab.length > 1 ? 's' : ''} past due`,
      detail: `${lateLab.map((c) => `${c.caseType} for ${c.patientName} (${c.labName})`).slice(0, 2).join('; ')}${lateLab.length > 2 ? '…' : ''} - chase the lab before the fitting appointment slips.`,
      action: { label: 'Open Lab Work', path: '/lab-work' },
    });
  }

  // 6 · Insurance claims aging in review
  const agingClaims = claims.filter((c) => (c.status === 'Submitted' || c.status === 'In Review') && daysAgo(c.submittedDate) > 14);
  if (agingClaims.length) {
    const value = agingClaims.reduce((s, c) => s + (c.claimedAmount || 0), 0);
    insights.push({
      id: 'aging-claims', severity: 'warning', category: 'Revenue',
      title: `${rs(value)} stuck in claims older than 14 days`,
      detail: `${agingClaims.length} claim${agingClaims.length > 1 ? 's' : ''} awaiting payer response - follow up to keep the revenue cycle moving.`,
      action: { label: 'Open Insurance', path: '/insurance' },
    });
  }

  // 7 · Membership renewals due in the next 30 days
  const renewing = memberships.filter((m) => m.status === 'Active' && m.renewalDate && daysUntil(m.renewalDate) >= 0 && daysUntil(m.renewalDate) <= 30);
  if (renewing.length) {
    insights.push({
      id: 'renewals', severity: 'info', category: 'Revenue',
      title: `${renewing.length} membership${renewing.length > 1 ? 's' : ''} renew within 30 days`,
      detail: `${renewing.map((m) => `${m.patientName} (${m.planName})`).slice(0, 3).join(', ')} - a renewal nudge now protects recurring revenue.`,
      action: { label: 'Open Memberships', path: '/memberships' },
    });
  }

  // 8 · Forms waiting for signature 3+ days
  const staleForms = formSubmissions.filter((f) => f.status === 'Pending' && daysAgo(f.sentDate) >= 3);
  if (staleForms.length) {
    insights.push({
      id: 'stale-forms', severity: 'info', category: 'Compliance',
      title: `${staleForms.length} form${staleForms.length > 1 ? 's' : ''} unsigned for 3+ days`,
      detail: `${staleForms.map((f) => `${f.templateName} (${f.patientName})`).slice(0, 2).join('; ')}${staleForms.length > 2 ? '…' : ''} - consent gaps block treatment.`,
      action: { label: 'Open Forms', path: '/forms' },
    });
  }

  // 9 · Revenue momentum (this month vs last month)
  const monthKey = (dateStr) => String(dateStr || '').slice(0, 7);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  const sumMonth = (m) => payments.filter((p) => monthKey(p.date) === m).reduce((s, p) => s + (p.amount || 0), 0);
  const cur = sumMonth(thisMonth);
  const last = sumMonth(prevMonth);
  if (cur || last) {
    const up = cur >= last;
    const pct = last > 0 ? Math.round(((cur - last) / last) * 100) : 100;
    insights.push({
      id: 'revenue-momentum', severity: up ? 'positive' : 'warning', category: 'Revenue',
      title: `Collections ${up ? 'up' : 'down'} ${Math.abs(pct)}% vs last month`,
      detail: `${rs(cur)} collected this month vs ${rs(last)} last month.${up ? ' Keep the momentum going.' : ' Review outstanding balances and idle chair time.'}`,
      action: { label: 'Open Reports', path: '/reports' },
    });
  }

  // 10 · Collection rate health (all-time)
  const billed = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  if (billed > 0) {
    const rate = Math.round((collected / billed) * 100);
    insights.push({
      id: 'collection-rate', severity: rate < 70 ? 'warning' : 'positive', category: 'Revenue',
      title: `Collection rate is ${rate}%`,
      detail: rate < 70
        ? `${rs(billed - collected)} of billed work is uncollected - payment links and front-desk collection at checkout lift this fastest.`
        : `${rs(collected)} collected of ${rs(billed)} billed. Healthy - industry benchmark is ~90%+.`,
      action: { label: 'Open Billing', path: '/billing' },
    });
  }

  const order = { critical: 0, warning: 1, info: 2, positive: 3 };
  insights.sort((a, b) => order[a.severity] - order[b.severity]);

  if (!insights.some((i) => i.severity === 'critical' || i.severity === 'warning')) {
    insights.unshift({
      id: 'all-clear', severity: 'positive', category: 'Practice',
      title: 'No urgent issues found',
      detail: 'Billing, recalls, labs and claims all look healthy right now. DentIQ re-checks every time your data changes.',
    });
  }
  return insights;
};

// ── Ask DentIQ - deterministic Q&A over clinic data ──────────────────────────
// Intent-matched answers (transparent, always correct for the data it reads).
// The same signature can later route to an LLM with clinic-data context.
export const answerQuestion = (query, data) => {
  const q = String(query || '').toLowerCase();
  const {
    patients = [], appointments = [], invoices = [], payments = [],
    recalls = [], treatments = [],
  } = data;
  const t = todayStr();

  const inMonth = (dateStr) => String(dateStr || '').slice(0, 7) === t.slice(0, 7);

  if (/revenue|collect|earn|income/.test(q)) {
    const scope = /today/.test(q) ? 'today' : /month/.test(q) ? 'month' : 'all';
    const list = payments.filter((p) => (scope === 'today' ? p.date === t : scope === 'month' ? inMonth(p.date) : true));
    const total = list.reduce((s, p) => s + (p.amount || 0), 0);
    const label = scope === 'today' ? 'today' : scope === 'month' ? 'this month' : 'all-time';
    return { text: `Collections ${label}: ${rs(total)} across ${list.length} payment${list.length !== 1 ? 's' : ''}.`, action: { label: 'Open Reports', path: '/reports' } };
  }

  if (/outstanding|due|unpaid|owe|balance|debtor/.test(q)) {
    const open = invoices.filter((i) => (i.balanceDue || 0) > 0);
    const total = open.reduce((s, i) => s + i.balanceDue, 0);
    const top = [...open].sort((a, b) => b.balanceDue - a.balanceDue).slice(0, 3)
      .map((i) => `${i.patientName} ${rs(i.balanceDue)}`).join(' · ');
    return { text: open.length ? `Outstanding: ${rs(total)} across ${open.length} invoices. Top: ${top}.` : 'No outstanding balances - everything is collected. 🎉', action: { label: 'Open Billing', path: '/billing' } };
  }

  if (/appointment|schedule|visit/.test(q)) {
    const tomorrow = new Date(Date.now() + DAY);
    const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const day = /tomorrow/.test(q) ? tomStr : t;
    const list = appointments.filter((a) => a.date === day && a.status !== 'Cancelled');
    const lines = list.slice(0, 5).map((a) => `${a.time} ${a.patientName} (${a.type})`).join(' · ');
    return { text: list.length ? `${list.length} appointment${list.length > 1 ? 's' : ''} ${/tomorrow/.test(q) ? 'tomorrow' : 'today'}: ${lines}${list.length > 5 ? '…' : ''}` : `No appointments ${/tomorrow/.test(q) ? 'tomorrow' : 'today'}.`, action: { label: 'Open Appointments', path: '/appointments' } };
  }

  if (/no.?show|risk/.test(q)) {
    const risks = findNoShowRisks({ appointments });
    return { text: risks.length ? `${risks.length} upcoming appointment${risks.length > 1 ? 's' : ''} at no-show risk: ${risks.map((r) => `${r.patientName} (${r.priorNoShows} prior, ${r.risk.toLowerCase()} risk)`).join(' · ')}. Recommend sending reminders.` : 'No no-show risks detected on upcoming appointments.', action: { label: 'Open Recalls', path: '/recalls' } };
  }

  if (/recall|overdue check|follow.?up/.test(q)) {
    const overdue = recalls.filter((r) => r.dueDate && r.dueDate < t && (r.status === 'Pending' || r.status === 'Reminded'));
    return { text: overdue.length ? `${overdue.length} overdue recall${overdue.length > 1 ? 's' : ''}: ${overdue.map((r) => `${r.patientName} (${r.type})`).slice(0, 4).join(' · ')}.` : 'No overdue recalls. 👍', action: { label: 'Open Recalls', path: '/recalls' } };
  }

  if (/top procedure|popular|common treatment|procedure/.test(q)) {
    const counts = {};
    treatments.forEach((tr) => { counts[tr.type] = (counts[tr.type] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} (${v})`).join(' · ');
    return { text: top ? `Top procedures: ${top}.` : 'No treatments recorded yet.', action: { label: 'Open Treatments', path: '/treatments' } };
  }

  if (/how many patient|patient count|patients do/.test(q)) {
    const active = patients.filter((p) => p.status === 'Active').length;
    return { text: `${patients.length} registered patients - ${active} active, ${patients.filter((p) => p.status === 'Pending Payment').length} with pending payments.`, action: { label: 'Open Patients', path: '/patients' } };
  }

  return {
    text: 'I can answer questions about: revenue (today / this month), outstanding balances, appointments (today / tomorrow), no-show risks, overdue recalls, top procedures, and patient counts. Try one of the suggestions below.',
  };
};
