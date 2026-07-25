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
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../hooks/useNotification';
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
// date back a day for timezones ahead of UTC, e.g. PKT - breaking preset ranges.)
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

// PDF-safe money: jsPDF's built-in fonts don't include the ₨ glyph, so we
// render an ASCII "Rs " prefix instead of the currency symbol.
const pdfMoney = (n) => `Rs ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

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
  const { patients, appointments, treatments, invoices, payments, dentists } = useClinicData();
  const { notify } = useNotification();

  const [pdfBusy, setPdfBusy]     = useState(false);
  const [preset, setPreset]       = useState(initPreset);
  const [startDate, setStartDate] = useState(initDates.start); // YYYY-MM-DD string
  const [endDate, setEndDate]     = useState(initDates.end);   // YYYY-MM-DD string
  const [granularity, setGranularity] = useState('Monthly');   // Daily | Weekly | Monthly | Quarterly
  const [dentistFilter, setDentistFilter] = useState('All');   // 'All' | dentist id
  const isDentistView = dentistFilter !== 'All';

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== 'custom') {
      const dates = calcPreset(val);
      if (dates) { setStartDate(dates.start); setEndDate(dates.end); }
    }
  };

  // Native <input type="date"> emits YYYY-MM-DD directly - same format as state.
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

  // Some records carry dentistId, others only dentistName (e.g. treatments),
  // so match on either to attribute a row to the selected dentist reliably.
  const selectedDentist = useMemo(() => dentists.find((d) => d.id === dentistFilter), [dentists, dentistFilter]);
  const byDentist = useCallback((row) => {
    if (dentistFilter === 'All') return true;
    return row.dentistId === dentistFilter || (selectedDentist && row.dentistName === selectedDentist.name);
  }, [dentistFilter, selectedDentist]);

  const filteredPayments     = useMemo(() => payments.filter((p) => inRange(p.date)),     [payments, inRange]);
  const filteredInvoices     = useMemo(() => invoices.filter((i) => inRange(i.date)),     [invoices, inRange]);
  const filteredAppointments = useMemo(() => appointments.filter((a) => inRange(a.date) && byDentist(a)), [appointments, inRange, byDentist]);
  const filteredTreatments   = useMemo(() => treatments.filter((t) => inRange(t.date) && byDentist(t)),   [treatments, inRange, byDentist]);

  // Per-dentist figures (attributable from treatments/appointments, which carry
  // the dentist). "Production" = fees the dentist generated in the period;
  // patient count = distinct patients they saw/treated.
  const dentistProduction = useMemo(() => filteredTreatments.reduce((s, t) => s + Number(t.cost || 0), 0), [filteredTreatments]);
  const dentistPatientCount = useMemo(() => {
    const ids = new Set();
    filteredTreatments.forEach((t) => t.patientId && ids.add(t.patientId));
    filteredAppointments.forEach((a) => a.patientId && ids.add(a.patientId));
    return ids.size;
  }, [filteredTreatments, filteredAppointments]);

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

  // Generate a real, downloadable PDF with jsPDF (loaded on demand so it stays
  // out of the initial bundle). One click = one .pdf file, no print dialog.
  const generatePdfReport = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const BLUE = [26, 93, 200];

      // ── Header ──
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, pageW, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...BLUE);
      doc.text('Dr Zaid Dental — Clinic Performance Report', 40, 46);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated ${new Date().toLocaleString()}   |   Period: ${subtitleText}`, 40, 63);

      const headStyle = { fillColor: BLUE, textColor: 255, fontStyle: 'bold', fontSize: 9 };

      // ── KPI row ──
      autoTable(doc, {
        startY: 80,
        head: [['Patients', 'Appointments', 'Treatments', 'Outstanding']],
        body: [[patients.length, filteredAppointments.length, filteredTreatments.length, pdfMoney(report.outstanding)]],
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 10, halign: 'center' },
      });

      // ── Financial + Patient summary ──
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Financial Summary', '']],
        body: [
          ['Total Billed', pdfMoney(report.billed)],
          ['Revenue Collected', pdfMoney(report.revenue)],
          ['Outstanding Balance', pdfMoney(report.outstanding)],
          ['Collection Rate', `${report.collectionRate}%`],
          ['Active Patients', report.activePatients],
          ['Pending Payment', report.pendingPatients],
          ['Paid Invoices', `${report.paidInvoices} / ${filteredInvoices.length}`],
        ],
        theme: 'grid',
        headStyles: headStyle,
        columnStyles: { 1: { halign: 'right' } },
        styles: { fontSize: 9.5 },
      });

      // ── Period summary ──
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [[`${granularity} Period`, 'Appts', 'Revenue', 'Billed', 'Outstanding', 'Paid/Part/Unpaid']],
        body: periodSummary.length
          ? periodSummary.map((r) => [r.label, r.appointments, pdfMoney(r.revenue), pdfMoney(r.billed), pdfMoney(r.outstanding), `${r.paidInvoices}/${r.partialInvoices}/${r.unpaidInvoices}`])
          : [['No activity in the selected period.', '', '', '', '', '']],
        theme: 'striped',
        headStyles: headStyle,
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        styles: { fontSize: 8.5 },
      });

      // ── Recent invoices ──
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Invoice', 'Patient', 'Date', 'Total', 'Balance', 'Status']],
        body: recentInvoices.length
          ? recentInvoices.map((i) => [i.invoiceNumber, i.patientName, formatDate(i.date), pdfMoney(i.totalAmount), pdfMoney(i.balanceDue), i.status])
          : [['No invoices available.', '', '', '', '', '']],
        theme: 'striped',
        headStyles: headStyle,
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
        styles: { fontSize: 8.5 },
      });

      // ── Recent treatments ──
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Date', 'Patient', 'Procedure', 'Tooth', 'Fee']],
        body: filteredTreatments.slice(0, 10).length
          ? filteredTreatments.slice(0, 10).map((t) => [formatDate(t.date), t.patientName, t.type, t.toothNumber, pdfMoney(t.cost)])
          : [['No treatments available.', '', '', '', '']],
        theme: 'striped',
        headStyles: headStyle,
        columnStyles: { 4: { halign: 'right' } },
        styles: { fontSize: 8.5 },
      });

      doc.save(`dr-zaid-report_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      notify('Could not generate the PDF. Please try again.', 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  // Reliable file download (Blob + anchor) - always downloads, no pop-up needed.
  const csvEscape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCsvReport = () => {
    const rows = [
      ['Dr Zaid Dental - Clinic Performance Report'],
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

        {/* Left - title */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Analytics & Reports
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary, mt: '2px' }}>
            {subtitleText}
          </Typography>
        </Box>

        {/* Right - exports */}
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
            disabled={pdfBusy}
            startIcon={<PictureAsPdfIcon sx={{ fontSize: 17 }} />}
            onClick={generatePdfReport}
            sx={{ height: 38, borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap', px: 2 }}
          >
            {pdfBusy ? 'Generating…' : 'Export PDF'}
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

          {/* Dentist filter - scopes the report to a single doctor */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Typography sx={FILTER_LABEL_SX}>Dentist</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '7px', bgcolor: '#F3F4F6', px: '10px', height: 38 }}>
              <Select
                value={dentistFilter}
                onChange={(e) => setDentistFilter(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{ fontSize: '0.85rem', fontWeight: 700, color: colors.primary, minWidth: 150, '& .MuiSelect-select': { py: 0 }, '& .MuiSelect-icon': { color: colors.primary } }}
              >
                <MenuItem value="All" sx={{ fontSize: '0.85rem', fontWeight: dentistFilter === 'All' ? 700 : 400 }}>All Dentists</MenuItem>
                {dentists.map((d) => (
                  <MenuItem key={d.id} value={d.id} sx={{ fontSize: '0.85rem', fontWeight: d.id === dentistFilter ? 700 : 400 }}>{d.name}</MenuItem>
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

          {/* Today shortcut - for daily activity */}
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
          { label: isDentistView ? 'Patients Seen' : 'Registered Patients', value: isDentistView ? dentistPatientCount : patients.length, detail: isDentistView ? 'By this dentist' : `${report.activePatients} active`, icon: <PeopleIcon />,              bg: '#EEF2FF', color: colors.primary },
          { label: 'Appointments',         value: filteredAppointments.length,           detail: isDentistView ? 'By this dentist' : 'In selected period', icon: <CalendarMonthIcon />,       bg: '#E0F2FE', color: '#0369A1' },
          { label: 'Treatment Cases',      value: filteredTreatments.length,             detail: 'Procedures recorded',                  icon: <LocalHospitalIcon />,       bg: '#ECFDF5', color: '#0D9488' },
          { label: isDentistView ? 'Production (Fees)' : 'Revenue Collected', value: isDentistView ? formatCurrency(dentistProduction) : formatCurrency(report.revenue), detail: isDentistView ? 'Fees this dentist generated' : `${report.collectionRate}% collection rate`, icon: <AccountBalanceWalletIcon />, bg: '#F0FDF4', color: colors.success },
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

      {/* Context note when scoped to one dentist */}
      {isDentistView && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderRadius: '10px', bgcolor: '#EAF2FB', border: '1px solid #C3DCF3' }}>
          <InfoIcon sx={{ fontSize: 18, color: colors.primary }} />
          <Typography variant="body2" sx={{ color: '#0A3254', fontSize: '0.82rem' }}>
            Showing <strong>{selectedDentist?.name}</strong>&apos;s patients, visits, treatments and production (the cards above). The billing tables below cover the <strong>whole clinic</strong> — payments aren&apos;t split per dentist.
          </Typography>
        </Box>
      )}

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
