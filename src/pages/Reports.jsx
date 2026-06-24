import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  PictureAsPdf as PictureAsPdfIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarMonthIcon,
  LocalHospital as LocalHospitalIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  TrendingUp as TrendingUpIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { buildPeriodSummary, totalsFromBuckets, GRANULARITIES } from '../utils/reporting';
import { colors } from '../theme/theme';
import StatusBadge from '../components/common/StatusBadge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#1A5DC8', '#0D9488', '#D97706', '#7C3AED', '#DC2626', '#DB2777', '#0369A1'];

// Native date-input styling (matches the filter pill, has a built-in calendar).
const DATE_INPUT_SX = {
  border: '1px solid #E5E7EB',
  borderRadius: '7px',
  bgcolor: '#F3F4F6',
  px: '8px',
  py: '5px',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
  fontWeight: 600,
  color: '#1F2937',
  cursor: 'pointer',
  colorScheme: 'light',
  '&:hover': { borderColor: '#0F4C81' },
  '&:focus': { outline: 'none', borderColor: '#0F4C81' },
  '&::-webkit-calendar-picker-indicator': { cursor: 'pointer', opacity: 0.6 },
};

const FILTER_LABEL_SX = { fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' };

// Format as local YYYY-MM-DD. (toISOString() would convert to UTC and shift the
// date back a day for timezones ahead of UTC, e.g. PKT — breaking preset ranges.)
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const calcPreset = (preset) => {
  const now = new Date();
  switch (preset) {
    case 'today': {
      return { start: toDateStr(now), end: toDateStr(now) };
    }
    case 'last_7': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: toDateStr(start), end: toDateStr(now) };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toDateStr(start), end: toDateStr(now) };
    }
    case 'last_30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start: toDateStr(start), end: toDateStr(now) };
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { start: toDateStr(start), end: toDateStr(now) };
    }
    case 'last_year': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    default:
      return null;
  }
};

const initPreset  = 'this_month';
const initDates   = calcPreset(initPreset);

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function ChartTip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: colors.sidebar, color: '#fff', px: 1.5, py: 1, borderRadius: '8px', boxShadow: 3 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, mb: 0.5, opacity: 0.7 }}>{label}</Typography>
      {payload.map((p) => (
        <Typography key={p.dataKey} sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
          {currency ? formatCurrency(p.value) : p.value}
        </Typography>
      ))}
    </Box>
  );
}

const PRESETS = [
  { value: 'today',      label: 'Today' },
  { value: 'last_7',     label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30',    label: 'Last 30 Days' },
  { value: 'quarter',    label: 'Quarter-to-Date' },
  { value: 'last_year',  label: 'Last Year' },
  { value: 'custom',     label: 'Custom Range' },
];

export default function Reports() {
  const { patients, appointments, treatments, invoices, payments } = useClinicData();

  const [preset, setPreset]       = useState(initPreset);
  const [startDate, setStartDate] = useState(initDates.start); // YYYY-MM-DD string
  const [endDate, setEndDate]     = useState(initDates.end);   // YYYY-MM-DD string
  const [granularity, setGranularity] = useState('Monthly');   // Daily | Weekly | Monthly | Quarterly

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== 'custom') {
      const dates = calcPreset(val);
      if (dates) { setStartDate(dates.start); setEndDate(dates.end); }
    }
  };

  // Native <input type="date"> emits YYYY-MM-DD directly — same format as state.
  const handleStartChange = (e) => {
    if (e.target.value) { setStartDate(e.target.value); setPreset('custom'); }
  };
  const handleEndChange = (e) => {
    if (e.target.value) { setEndDate(e.target.value); setPreset('custom'); }
  };

  const inRange = useCallback((dateStr) => {
    if (!dateStr) return true;
    const d = dateStr.split('T')[0];
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    return true;
  }, [startDate, endDate]);

  const filteredPayments     = useMemo(() => payments.filter((p) => inRange(p.date)),     [payments, inRange]);
  const filteredInvoices     = useMemo(() => invoices.filter((i) => inRange(i.date)),     [invoices, inRange]);
  const filteredAppointments = useMemo(() => appointments.filter((a) => inRange(a.date)), [appointments, inRange]);
  const filteredTreatments   = useMemo(() => treatments.filter((t) => inRange(t.date)),   [treatments, inRange]);

  const report = useMemo(() => {
    const revenue     = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const billed      = filteredInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const outstanding = filteredInvoices.reduce((sum, i) => sum + Number(i.balanceDue || 0), 0);
    const paidInvoices = filteredInvoices.filter((i) => i.status === 'Paid').length;
    const collectionRate = billed > 0 ? Math.round((revenue / billed) * 100) : 0;
    const activePatients  = patients.filter((p) => p.status === 'Active').length;
    const pendingPatients = patients.filter((p) => p.status === 'Pending Payment').length;
    const procedureCounts = filteredTreatments.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});
    const topProcedures   = Object.entries(procedureCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    return { revenue, billed, outstanding, paidInvoices, collectionRate, activePatients, pendingPatients, topProcedures };
  }, [filteredPayments, filteredInvoices, filteredTreatments, patients]);

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: MONTHS[d.getMonth()], revenue: 0, year: d.getFullYear(), m: d.getMonth() };
    });
    // Always uses all payments so the 6-month trend reflects full history
    payments.forEach((p) => {
      const d = new Date(p.date);
      const bucket = buckets.find((b) => b.m === d.getMonth() && b.year === d.getFullYear());
      if (bucket) bucket.revenue += Number(p.amount || 0);
    });
    return buckets;
  }, [payments]);

  // Grouped period summary (Daily / Weekly / Monthly / Quarterly), honouring
  // the active date range. Each row carries appointments, revenue, billed,
  // outstanding and a full-vs-partial-vs-unpaid invoice breakdown.
  const periodSummary = useMemo(
    () => buildPeriodSummary(
      { appointments, invoices, payments },
      granularity,
      { start: startDate, end: endDate },
    ),
    [appointments, invoices, payments, granularity, startDate, endDate],
  );
  const periodTotals = useMemo(() => totalsFromBuckets(periodSummary), [periodSummary]);

  const apptStatus = useMemo(() => {
    const map = {};
    filteredAppointments.forEach((a) => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [filteredAppointments]);

  const recentInvoices = filteredInvoices.slice(0, 8);

  const fmtShort = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
  };

  const subtitleText = useMemo(() => {
    const found = PRESETS.find((p) => p.value === preset);
    if (startDate && endDate) return `${fmtShort(startDate)} → ${fmtShort(endDate)}`;
    return found ? found.label : 'Selected period';
  }, [preset, startDate, endDate]);

  const generatePdfReport = () => {
    const generatedAt = new Date().toLocaleString();
    const invoiceRows = recentInvoices.map((invoice) => `
      <tr>
        <td>${escapeHtml(invoice.invoiceNumber)}</td>
        <td>${escapeHtml(invoice.patientName)}</td>
        <td>${escapeHtml(formatDate(invoice.date))}</td>
        <td class="num">${escapeHtml(formatCurrency(invoice.totalAmount))}</td>
        <td class="num">${escapeHtml(formatCurrency(invoice.balanceDue))}</td>
        <td>${escapeHtml(invoice.status)}</td>
      </tr>
    `).join('');

    const periodRows = periodSummary.map((row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td class="num">${row.appointments}</td>
        <td class="num">${escapeHtml(formatCurrency(row.revenue))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.billed))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.outstanding))}</td>
        <td class="num">${row.paidInvoices} / ${row.partialInvoices} / ${row.unpaidInvoices}</td>
      </tr>
    `).join('');

    const treatmentRows = filteredTreatments.slice(0, 10).map((treatment) => `
      <tr>
        <td>${escapeHtml(formatDate(treatment.date))}</td>
        <td>${escapeHtml(treatment.patientName)}</td>
        <td>${escapeHtml(treatment.type)}</td>
        <td>${escapeHtml(treatment.toothNumber)}</td>
        <td class="num">${escapeHtml(formatCurrency(treatment.cost))}</td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><title>Clinic Performance Report</title>
      <style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
      header { border-bottom: 3px solid #1A5DC8; padding-bottom: 16px; margin-bottom: 24px; }
      h1 { margin: 0; font-size: 26px; color: #1A5DC8; } h2 { font-size: 16px; margin: 28px 0 10px; color: #111827; }
      .muted { color: #6B7280; font-size: 12px; margin-top: 6px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; }
      .label { font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 700; }
      .value { font-size: 20px; font-weight: 800; margin-top: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #F3F4F6; text-align: left; color: #374151; }
      th, td { border: 1px solid #E5E7EB; padding: 8px; } .num { text-align: right; }
      .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      @media print { body { margin: 18mm; } button { display: none; } }</style></head>
      <body><header><h1>Dr Zaid Dental — Clinic Performance Report</h1>
      <div class="muted">Generated ${escapeHtml(generatedAt)} · Period: ${escapeHtml(subtitleText)}</div></header>
      <section class="grid">
        <div class="card"><div class="label">Patients</div><div class="value">${patients.length}</div></div>
        <div class="card"><div class="label">Appointments</div><div class="value">${filteredAppointments.length}</div></div>
        <div class="card"><div class="label">Treatments</div><div class="value">${filteredTreatments.length}</div></div>
        <div class="card"><div class="label">Outstanding</div><div class="value">${escapeHtml(formatCurrency(report.outstanding))}</div></div>
      </section>
      <section class="summary">
        <div><h2>Financial Summary</h2><table><tbody>
          <tr><th>Total Billed</th><td class="num">${escapeHtml(formatCurrency(report.billed))}</td></tr>
          <tr><th>Revenue Collected</th><td class="num">${escapeHtml(formatCurrency(report.revenue))}</td></tr>
          <tr><th>Outstanding Balance</th><td class="num">${escapeHtml(formatCurrency(report.outstanding))}</td></tr>
          <tr><th>Collection Rate</th><td class="num">${report.collectionRate}%</td></tr>
        </tbody></table></div>
        <div><h2>Patient Summary</h2><table><tbody>
          <tr><th>Active Patients</th><td class="num">${report.activePatients}</td></tr>
          <tr><th>Pending Payment</th><td class="num">${report.pendingPatients}</td></tr>
          <tr><th>Paid Invoices</th><td class="num">${report.paidInvoices}</td></tr>
          <tr><th>Total Invoices</th><td class="num">${filteredInvoices.length}</td></tr>
        </tbody></table></div>
      </section>
      <h2>${escapeHtml(granularity)} Summary</h2>
      <table><thead><tr><th>Period</th><th class="num">Appointments</th><th class="num">Revenue</th><th class="num">Billed</th><th class="num">Outstanding</th><th class="num">Paid / Partial / Unpaid</th></tr></thead>
      <tbody>${periodRows || '<tr><td colspan="6">No activity in the selected period.</td></tr>'}</tbody></table>
      <h2>Recent Invoices</h2>
      <table><thead><tr><th>Invoice</th><th>Patient</th><th>Date</th><th class="num">Total</th><th class="num">Balance</th><th>Status</th></tr></thead>
      <tbody>${invoiceRows || '<tr><td colspan="6">No invoices available.</td></tr>'}</tbody></table>
      <h2>Recent Treatments</h2>
      <table><thead><tr><th>Date</th><th>Patient</th><th>Procedure</th><th>Tooth</th><th class="num">Fee</th></tr></thead>
      <tbody>${treatmentRows || '<tr><td colspan="5">No treatments available.</td></tr>'}</tbody></table>
      </body></html>`;

    // Render into a hidden iframe and print from there. This avoids pop-up
    // blockers (which silently kill window.open on deployed hosts like Vercel),
    // so "Export PDF → Save as PDF" works reliably.
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 350);
  };

  // Reliable file download (Blob + anchor) — always downloads, no pop-up needed.
  const csvEscape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCsvReport = () => {
    const rows = [
      ['Dr Zaid Dental — Clinic Performance Report'],
      ['Generated', new Date().toLocaleString()],
      ['Period', `${startDate} to ${endDate}`],
      [],
      ['Summary'],
      ['Total Billed', report.billed],
      ['Revenue Collected', report.revenue],
      ['Outstanding', report.outstanding],
      ['Collection Rate (%)', report.collectionRate],
      ['Appointments', filteredAppointments.length],
      ['Treatments', filteredTreatments.length],
      [],
      [`${granularity} Summary`],
      ['Period', 'Appointments', 'Revenue', 'Billed', 'Outstanding', 'Paid', 'Partial', 'Unpaid'],
      ...periodSummary.map((r) => [r.label, r.appointments, r.revenue, r.billed, r.outstanding, r.paidInvoices, r.partialInvoices, r.unpaidInvoices]),
      ['Total', periodTotals.appointments, periodTotals.revenue, periodTotals.billed, periodTotals.outstanding, periodTotals.paidInvoices, periodTotals.partialInvoices, periodTotals.unpaidInvoices],
      [],
      ['Invoices in period'],
      ['Invoice', 'Patient', 'Date', 'Total', 'Paid', 'Balance', 'Status'],
      ...filteredInvoices.map((i) => [i.invoiceNumber, i.patientName, i.date, i.totalAmount, i.paidAmount, i.balanceDue, i.status]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dr-zaid-report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>

        {/* Left — title */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Analytics & Reports
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary, mt: '2px' }}>
            {subtitleText}
          </Typography>
        </Box>

        {/* Right — exports */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
            onClick={downloadCsvReport}
            sx={{ height: 38, borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap', px: 2 }}
          >
            Download CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon sx={{ fontSize: 17 }} />}
            onClick={generatePdfReport}
            sx={{ height: 38, borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap', px: 2 }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* ── Date range filter bar (prominent, labelled) ── */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ p: '14px 18px', display: 'flex', alignItems: 'flex-end', gap: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: 'center' }}>
            <DateRangeIcon sx={{ fontSize: 20, color: colors.primary }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary }}>Date Range</Typography>
          </Box>

          {/* Quick range preset */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography sx={FILTER_LABEL_SX}>Quick range</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '7px', bgcolor: '#F3F4F6', px: '10px', height: 38 }}>
              <Select
                value={preset}
                onChange={handlePresetChange}
                variant="standard"
                disableUnderline
                sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.primary, minWidth: 150, '& .MuiSelect-select': { py: 0 }, '& .MuiSelect-icon': { color: colors.primary } }}
              >
                {PRESETS.map((p) => (
                  <MenuItem key={p.value} value={p.value} sx={{ fontSize: '0.85rem', fontWeight: p.value === preset ? 700 : 400 }}>{p.label}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* Start date */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography sx={FILTER_LABEL_SX}>Start date (From)</Typography>
            <Box component="input" type="date" value={startDate} max={endDate || undefined} onChange={handleStartChange}
              sx={{ ...DATE_INPUT_SX, height: 38, px: '12px', fontSize: '0.85rem', minWidth: 160 }} />
          </Box>

          {/* End date */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography sx={FILTER_LABEL_SX}>End date (To)</Typography>
            <Box component="input" type="date" value={endDate} min={startDate || undefined} onChange={handleEndChange}
              sx={{ ...DATE_INPUT_SX, height: 38, px: '12px', fontSize: '0.85rem', minWidth: 160 }} />
          </Box>

          {/* Today shortcut — for daily activity */}
          <Button
            variant="text"
            onClick={() => { const d = calcPreset('today'); setStartDate(d.start); setEndDate(d.end); setPreset('today'); }}
            sx={{ height: 38, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem' }}
          >
            Today
          </Button>

          <Typography sx={{ ml: 'auto', alignSelf: 'center', fontSize: '0.75rem', color: colors.textSecondary }}>
            Showing <Box component="span" sx={{ fontWeight: 700, color: colors.textPrimary }}>{subtitleText}</Box>
          </Typography>
        </Box>
      </Card>

      {/* ── KPI cards ── */}
      <Grid container spacing={2}>
        {[
          { label: 'Registered Patients', value: patients.length,                      detail: `${report.activePatients} active`,      icon: <PeopleIcon />,              bg: '#EEF2FF', color: colors.primary },
          { label: 'Appointments',         value: filteredAppointments.length,           detail: 'In selected period',                   icon: <CalendarMonthIcon />,       bg: '#E0F2FE', color: '#0369A1' },
          { label: 'Treatment Cases',      value: filteredTreatments.length,             detail: 'Procedures recorded',                  icon: <LocalHospitalIcon />,       bg: '#ECFDF5', color: '#0D9488' },
          { label: 'Revenue Collected',    value: formatCurrency(report.revenue),        detail: `${report.collectionRate}% collection rate`, icon: <AccountBalanceWalletIcon />, bg: '#F0FDF4', color: colors.success },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: '18px 20px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{card.label}</Typography>
                  <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: card.bg, color: card.color, display: 'flex', fontSize: 18 }}>{card.icon}</Box>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>{card.value}</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>{card.detail}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Revenue Trend ── */}
      <Card sx={{ borderRadius: '12px' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ fontSize: 18, color: colors.primary }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>Revenue Trend</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>Last 6 months · all payments</Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2.5, pt: 2 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: colors.textLight }}
                axisLine={false} tickLine={false} width={36}
                domain={([, dataMax]) => {
                  const ceil = Math.ceil(dataMax * 1.3 / 5000) * 5000 || 10000;
                  return [0, ceil];
                }}
              />
              <Tooltip content={<ChartTip currency />} />
              <Area type="monotoneX" dataKey="revenue" stroke={colors.primary} strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: colors.primary, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* ── Appointment Status + Procedure Breakdown ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Appointment Status</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Distribution by status</Typography>
            </Box>
            <Box sx={{ p: 2.5, pt: 2 }}>
              {apptStatus.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="caption" sx={{ color: colors.textSecondary }}>No appointment data for this period.</Typography></Box>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={apptStatus} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 10, fill: colors.textLight }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colors.textLight }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Procedure Breakdown</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Top procedures by volume</Typography>
            </Box>
            <Box sx={{ p: 2.5, pt: 2 }}>
              {report.topProcedures.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="caption" sx={{ color: colors.textSecondary }}>No treatment data for this period.</Typography></Box>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={report.topProcedures} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3} isAnimationActive={false}>
                      {report.topProcedures.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: colors.textSecondary }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Collection Performance + Top Procedures ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Collection Performance</Typography>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>{formatCurrency(report.revenue)} collected from {formatCurrency(report.billed)} billed.</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ mb: 0.5 }}>
                <LinearProgress variant="determinate" value={Math.min(report.collectionRate, 100)} sx={{ height: 8, borderRadius: 999, bgcolor: colors.borderLight, '& .MuiLinearProgress-bar': { bgcolor: colors.success } }} />
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Collection rate</Typography>
                <Typography variant="caption" fontWeight={700}>{report.collectionRate}%</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {[
                  { label: 'Total Billed',        value: formatCurrency(report.billed),      color: colors.textPrimary },
                  { label: 'Revenue Collected',    value: formatCurrency(report.revenue),     color: colors.success },
                  { label: 'Outstanding Balance',  value: formatCurrency(report.outstanding), color: colors.error },
                  { label: 'Paid Invoices',        value: `${report.paidInvoices} / ${filteredInvoices.length}`, color: colors.textPrimary },
                ].map(({ label, value, color }) => (
                  <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
              <Typography variant="subtitle2" fontWeight={700}>Top Procedures by Volume</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              {report.topProcedures.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><Typography variant="caption" sx={{ color: colors.textSecondary }}>No treatment data available for this period.</Typography></Box>
              ) : (
                <Stack spacing={1.75}>
                  {report.topProcedures.map((proc, i) => {
                    const max = report.topProcedures[0].count;
                    const pct = Math.round((proc.count / max) * 100);
                    return (
                      <Box key={proc.name}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{proc.name}</Typography>
                          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}>{proc.count} case{proc.count !== 1 ? 's' : ''}</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 999, bgcolor: colors.borderLight, '& .MuiLinearProgress-bar': { bgcolor: PIE_COLORS[i % PIE_COLORS.length] } }} />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Period Summary (Daily / Weekly / Monthly / Quarterly) ── */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>Period Summary</Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Appointments, revenue & dues grouped by {granularity.toLowerCase()} period
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={granularity}
            exclusive
            size="small"
            onChange={(_, val) => { if (val) setGranularity(val); }}
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.5, py: 0.5,
                color: colors.textSecondary, border: `1px solid ${colors.border}`,
                '&.Mui-selected': { bgcolor: colors.primary, color: '#fff', '&:hover': { bgcolor: colors.primary } },
              },
            }}
          >
            {GRANULARITIES.map((g) => (
              <ToggleButton key={g} value={g}>{g}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Appointments</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Billed</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="center">Paid / Partial / Unpaid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periodSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', borderBottom: 0 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>No activity in the selected date range.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {periodSummary.map((row) => (
                    <TableRow key={row.key} hover>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{row.label}</TableCell>
                      <TableCell align="right">{row.appointments}</TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={700} sx={{ color: colors.success }}>{formatCurrency(row.revenue)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{formatCurrency(row.billed)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600} sx={{ color: row.outstanding > 0 ? colors.error : colors.textSecondary }}>{formatCurrency(row.outstanding)}</Typography></TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.75} justifyContent="center">
                          <Chip label={row.paidInvoices} size="small" sx={{ height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#ECFDF5', color: colors.success }} />
                          <Chip label={row.partialInvoices} size="small" sx={{ height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#FFFBEB', color: '#D97706' }} />
                          <Chip label={row.unpaidInvoices} size="small" sx={{ height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem', bgcolor: '#FEF2F2', color: colors.error }} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: colors.surfaceAlt }}>
                    <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{periodTotals.appointments}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: colors.success }}>{formatCurrency(periodTotals.revenue)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(periodTotals.billed)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: periodTotals.outstanding > 0 ? colors.error : colors.textSecondary }}>{formatCurrency(periodTotals.outstanding)}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      {periodTotals.paidInvoices} / {periodTotals.partialInvoices} / {periodTotals.unpaidInvoices}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* ── Recent Invoices ── */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Recent Invoices</Typography>
          <Typography variant="caption" sx={{ color: colors.textSecondary }}>Last {recentInvoices.length} invoices in selected period</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', borderBottom: 0 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>No invoices in the selected date range.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>{inv.invoiceNumber}</TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{inv.patientName}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: colors.textSecondary }}>{formatDate(inv.date)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatCurrency(inv.totalAmount)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: inv.balanceDue > 0 ? colors.error : colors.success }}>{formatCurrency(inv.balanceDue)}</Typography>
                    </TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
