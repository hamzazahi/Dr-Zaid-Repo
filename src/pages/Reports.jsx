import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useMemo } from 'react';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { PictureAsPdf as PictureAsPdfIcon, Assessment as AssessmentIcon, People as PeopleIcon, CalendarMonth as CalendarMonthIcon, LocalHospital as LocalHospitalIcon, AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default function Reports() {
  const { patients, appointments, treatments, invoices, payments } = useClinicData();

  const report = useMemo(() => {
    const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const billed = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue || 0), 0);
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'Paid').length;
    const collectionRate = billed > 0 ? Math.round((revenue / billed) * 100) : 0;
    const activePatients = patients.filter((patient) => patient.status === 'Active').length;
    const pendingPatients = patients.filter((patient) => patient.status === 'Pending Payment').length;

    const procedureCounts = treatments.reduce((acc, treatment) => {
      acc[treatment.type] = (acc[treatment.type] || 0) + 1;
      return acc;
    }, {});

    const topProcedures = Object.entries(procedureCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      revenue,
      billed,
      outstanding,
      paidInvoices,
      collectionRate,
      activePatients,
      pendingPatients,
      topProcedures
    };
  }, [invoices, patients, payments, treatments]);

  const cards = [
    {
      label: 'Registered Patients',
      value: patients.length,
      detail: `${report.activePatients} active, ${report.pendingPatients} pending`,
      icon: <PeopleIcon />,
      color: '#1E3A8A'
    },
    {
      label: 'Appointments',
      value: appointments.length,
      detail: 'Scheduled and historical visits',
      icon: <CalendarMonthIcon />,
      color: '#2563EB'
    },
    {
      label: 'Treatment Cases',
      value: treatments.length,
      detail: 'Procedures recorded',
      icon: <LocalHospitalIcon />,
      color: '#0D9488'
    },
    {
      label: 'Revenue Collected',
      value: formatCurrency(report.revenue),
      detail: `${report.collectionRate}% collection rate`,
      icon: <AccountBalanceWalletIcon />,
      color: '#10B981'
    }
  ];

  const recentInvoices = invoices.slice(0, 8);

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

    const treatmentRows = treatments.slice(0, 10).map((treatment) => `
      <tr>
        <td>${escapeHtml(formatDate(treatment.date))}</td>
        <td>${escapeHtml(treatment.patientName)}</td>
        <td>${escapeHtml(treatment.type)}</td>
        <td>${escapeHtml(treatment.toothNumber)}</td>
        <td class="num">${escapeHtml(formatCurrency(treatment.cost))}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Clinic Performance Report</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
            header { border-bottom: 3px solid #1E3A8A; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 26px; color: #1E3A8A; }
            h2 { font-size: 16px; margin: 28px 0 10px; color: #111827; }
            .muted { color: #6B7280; font-size: 12px; margin-top: 6px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; }
            .label { font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 700; }
            .value { font-size: 20px; font-weight: 800; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #F3F4F6; text-align: left; color: #374151; }
            th, td { border: 1px solid #E5E7EB; padding: 8px; }
            .num { text-align: right; }
            .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media print { body { margin: 18mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <header>
            <h1>Dr Zaid Dental - Clinic Performance Report</h1>
            <div class="muted">Generated ${escapeHtml(generatedAt)}</div>
          </header>

          <section class="grid">
            <div class="card"><div class="label">Patients</div><div class="value">${patients.length}</div></div>
            <div class="card"><div class="label">Appointments</div><div class="value">${appointments.length}</div></div>
            <div class="card"><div class="label">Treatments</div><div class="value">${treatments.length}</div></div>
            <div class="card"><div class="label">Outstanding</div><div class="value">${escapeHtml(formatCurrency(report.outstanding))}</div></div>
          </section>

          <section class="summary">
            <div>
              <h2>Financial Summary</h2>
              <table>
                <tbody>
                  <tr><th>Total Billed</th><td class="num">${escapeHtml(formatCurrency(report.billed))}</td></tr>
                  <tr><th>Revenue Collected</th><td class="num">${escapeHtml(formatCurrency(report.revenue))}</td></tr>
                  <tr><th>Outstanding Balance</th><td class="num">${escapeHtml(formatCurrency(report.outstanding))}</td></tr>
                  <tr><th>Collection Rate</th><td class="num">${report.collectionRate}%</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h2>Patient Summary</h2>
              <table>
                <tbody>
                  <tr><th>Active Patients</th><td class="num">${report.activePatients}</td></tr>
                  <tr><th>Pending Payment</th><td class="num">${report.pendingPatients}</td></tr>
                  <tr><th>Paid Invoices</th><td class="num">${report.paidInvoices}</td></tr>
                  <tr><th>Total Invoices</th><td class="num">${invoices.length}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <h2>Recent Invoices</h2>
          <table>
            <thead>
              <tr><th>Invoice</th><th>Patient</th><th>Date</th><th class="num">Total</th><th class="num">Balance</th><th>Status</th></tr>
            </thead>
            <tbody>${invoiceRows || '<tr><td colspan="6">No invoices available.</td></tr>'}</tbody>
          </table>

          <h2>Recent Treatments</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Patient</th><th>Procedure</th><th>Tooth</th><th class="num">Fee</th></tr>
            </thead>
            <tbody>${treatmentRows || '<tr><td colspan="5">No treatments available.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups to generate the PDF report.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          border: '1px solid #E5E7EB'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <AssessmentIcon sx={{ color: '#1E3A8A' }} />
              <Typography variant="h5" fontWeight="bold">Clinic Reports</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Financial, patient, and treatment performance overview.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={generatePdfReport}
            sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172E6E' } }}
          >
            Generate PDF
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>{card.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: `${card.color}14`, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  {card.detail}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Collection Performance</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatCurrency(report.revenue)} collected from {formatCurrency(report.billed)} billed.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={Math.min(report.collectionRate, 100)} sx={{ height: 10, borderRadius: 999, bgcolor: '#E5E7EB' }} />
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Collection rate</Typography>
                <Typography variant="caption" fontWeight="bold">{report.collectionRate}%</Typography>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Outstanding balance</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error">{formatCurrency(report.outstanding)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Paid invoices</Typography>
                  <Typography variant="body2" fontWeight="bold">{report.paidInvoices} / {invoices.length}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Top Procedures</Typography>
              <Stack spacing={1.4} sx={{ mt: 2 }}>
                {report.topProcedures.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No treatment data available yet.</Typography>
                ) : (
                  report.topProcedures.map((procedure) => (
                    <Stack key={procedure.name} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{procedure.name}</Typography>
                      <Chip label={`${procedure.count} case(s)`} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', border: '1px solid #E5E7EB' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.patientName}</TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell align="right" sx={{ color: invoice.balanceDue > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                  {formatCurrency(invoice.balanceDue)}
                </TableCell>
                <TableCell>
                  <Chip label={invoice.status} size="small" color={invoice.status === 'Paid' ? 'success' : invoice.status === 'Partially Paid' ? 'warning' : 'error'} sx={{ fontWeight: 700 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
