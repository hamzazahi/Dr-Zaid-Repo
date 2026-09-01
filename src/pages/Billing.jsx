import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { usePermissions } from '../hooks/usePermissions';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { summariseInvoices, recalcInvoice, invoiceStatusLabel } from '../utils/billing';
import { PAYMENT_METHODS } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { Payment as PaymentIcon, ReceiptLong as ReceiptLongIcon, TrendingUp as TrendingUpIcon, HourglassEmpty as HourglassEmptyIcon, Print as PrintIcon, Block as BlockIcon, Edit as EditIcon } from '@mui/icons-material';

// PDF-safe money (jsPDF fonts lack the rupee glyph).
const rs = (n) => `Rs ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export default function Billing() {
  const { invoices, addPayment, waiveInvoice, updateInvoiceAmounts, patients, payments, treatments, locations } = useClinicData();
  const { isDoctor } = usePermissions();
  const { notify } = useNotification();
  const navigate = useNavigate();

  // Correct an invoice's figures: the total (a fee mistyped when logging the
  // treatment) and the amount actually paid (a receipt entered as 5,000
  // instead of 500). Doctor-only. Balance and status are never typed - they
  // are re-derived from the corrected pair, so the row updates accordingly.
  const [editTarget, setEditTarget] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPaid, setEditPaid] = useState('');
  const [editError, setEditError] = useState('');
  const openEdit = (inv) => {
    setEditTarget(inv);
    setEditAmount(String(inv.totalAmount ?? ''));
    setEditPaid(String(inv.paidAmount ?? ''));
    setEditError('');
  };

  // Live preview of what the edit will produce, run through the same state
  // machine the saved invoice goes through.
  const editPreview = useMemo(() => {
    if (!editTarget) return null;
    const total = Number(editAmount);
    const paid = Number(editPaid);
    if (editAmount === '' || editPaid === '' || Number.isNaN(total) || Number.isNaN(paid)) return null;
    if (total < 0 || paid < 0 || paid > total) return null;
    return recalcInvoice({ ...editTarget, totalAmount: total }, paid);
  }, [editTarget, editAmount, editPaid]);

  const submitEdit = () => {
    const total = Number(editAmount);
    const paid = Number(editPaid);
    if (editAmount === '' || Number.isNaN(total) || total < 0) { setEditError('Enter a valid invoice amount.'); return; }
    if (editPaid === '' || Number.isNaN(paid) || paid < 0) { setEditError('Enter a valid paid amount.'); return; }
    if (paid > total) { setEditError(`Paid can't be more than the invoice total of ${formatCurrency(total)}.`); return; }
    const ok = updateInvoiceAmounts(editTarget.id, { totalAmount: total, paidAmount: paid });
    if (!ok) { setEditError('Could not update this invoice. Please refresh and try again.'); return; }
    const balance = Math.max(0, total - paid);
    notify(
      `${editTarget.invoiceNumber} updated - paid ${formatCurrency(paid)} of ${formatCurrency(total)}, balance ${formatCurrency(balance)}.`,
      'success'
    );
    setEditTarget(null);
  };

  // Waive (write off) an unpaid charge - e.g. a consultation done the same
  // visit as the treatment. Doctor-only, and only when nothing has been paid.
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [waiveReason, setWaiveReason] = useState('');
  const confirmWaive = () => {
    if (!waiveTarget) return;
    waiveInvoice(waiveTarget.id, waiveReason.trim());
    notify(`${waiveTarget.invoiceNumber} waived - no charge to the patient.`, 'success');
    setWaiveTarget(null);
    setWaiveReason('');
  };

  // Generate a printable invoice/receipt PDF and open the printer dialog.
  const printInvoice = async (inv) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const clinic = locations?.find((l) => l.isPrimary) || locations?.[0];
      const clinicName = clinic?.name || 'Dr. Zaid Dental Clinic';
      const patient = patients.find((p) => p.id === inv.patientId);
      const invPayments = payments.filter((p) => p.invoiceId === inv.id);
      const lastPay = invPayments[invPayments.length - 1];
      // Best-effort line item: a treatment for this patient matching the amount.
      const match = treatments.find((t) => t.patientId === inv.patientId && Number(t.cost) === Number(inv.totalAmount));
      const description = match ? `${match.type}${match.toothNumber && match.toothNumber !== 'All' ? ` (tooth ${match.toothNumber})` : ''}` : 'Dental treatment / services';

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const BLUE = [26, 93, 200];

      // Header band
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, pageW, 76, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
      doc.text(clinicName, 40, 40);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
      doc.text([clinic?.address, clinic?.phone].filter(Boolean).join('   |   ') || 'Dental Clinic', 40, 58);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text('INVOICE', pageW - 40, 46, { align: 'right' });

      // Meta + Bill To
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(`Invoice #: ${inv.invoiceNumber}`, pageW - 40, 100, { align: 'right' });
      doc.text(`Date: ${formatDate(inv.date)}`, pageW - 40, 116, { align: 'right' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('BILL TO', 40, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(patient?.name || inv.patientName, 40, 116);
      if (patient?.phone) doc.text(patient.phone, 40, 130);

      // Line items
      autoTable(doc, {
        startY: 150,
        head: [['Description', 'Amount']],
        body: [[description, rs(inv.totalAmount)]],
        theme: 'grid',
        headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right', cellWidth: 120 } },
        styles: { fontSize: 10, cellPadding: 8 },
      });

      // Totals
      const y = doc.lastAutoTable.finalY + 16;
      autoTable(doc, {
        startY: y,
        body: [
          ['Total', rs(inv.totalAmount)],
          ['Paid', rs(inv.paidAmount)],
          ['Balance Due', rs(inv.balanceDue)],
          ['Status', inv.status],
        ],
        theme: 'plain',
        tableWidth: 240,
        margin: { left: pageW - 40 - 240 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        styles: { fontSize: 10.5, cellPadding: 3 },
      });

      let fy = doc.lastAutoTable.finalY + 24;
      doc.setFontSize(9.5); doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'normal');
      if (lastPay) doc.text(`Payment method: ${lastPay.method}   |   Received: ${formatDate(lastPay.date)}`, 40, fy);
      fy += 26;
      doc.setDrawColor(220, 224, 230); doc.line(40, fy, pageW - 40, fy);
      doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text(`Thank you for choosing ${clinicName}.`, 40, fy + 20);

      doc.autoPrint();
      const url = doc.output('bloburl');
      const win = window.open(url, '_blank');
      if (!win) { doc.save(`invoice_${inv.invoiceNumber}.pdf`); notify('Invoice downloaded (allow pop-ups to print directly).', 'info'); }
    } catch (err) {
      console.error('Print invoice failed:', err);
      notify('Could not generate the invoice. Please try again.', 'error');
    }
  };

  const stats = useMemo(() => summariseInvoices(invoices), [invoices]);

  // Inline "collect payment" dialog state - lets you mark a payment as
  // partial or full right from the invoice list; status updates instantly.
  const [payInvoice, setPayInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payError, setPayError] = useState('');

  const openCollect = (inv) => {
    setPayInvoice(inv);
    setPayAmount(String(inv.balanceDue)); // defaults to full balance
    setPayMethod('Cash');
    setPayError('');
  };

  const closeCollect = () => setPayInvoice(null);

  const submitCollect = (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { setPayError('Enter a valid payment amount.'); return; }
    if (amount > payInvoice.balanceDue) {
      setPayError(`Amount cannot exceed the balance due (${formatCurrency(payInvoice.balanceDue)}).`);
      return;
    }
    addPayment({ invoiceId: payInvoice.id, patientId: payInvoice.patientId, patientName: payInvoice.patientName, amount, method: payMethod });
    const fullyPaid = amount >= payInvoice.balanceDue;
    notify(`${formatCurrency(amount)} collected - invoice marked ${fullyPaid ? 'Fully Paid' : 'Partially Paid'}.`, 'success');
    closeCollect();
  };

  const statCards = [
    {
      label: 'Total Billed',
      value: formatCurrency(stats.total),
      icon: <ReceiptLongIcon />,
      color: colors.primary,
      bg: '#EFF6FF',
    },
    {
      label: 'Collected',
      value: formatCurrency(stats.collected),
      icon: <TrendingUpIcon />,
      color: colors.success,
      bg: '#ECFDF5',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstanding),
      icon: <HourglassEmptyIcon />,
      color: colors.error,
      bg: '#FEF2F2',
    },
    {
      label: 'Paid Invoices',
      value: `${stats.paidCount} / ${invoices.length}`,
      icon: <PaymentIcon />,
      color: '#0D9488',
      bg: '#F0FDFA',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Billing & Invoicing</Typography>
        <Typography variant="body2" color="text.secondary">
          Track invoices, due balances, and patient collections.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card>
              <CardContent sx={{ p: '20px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bg, color: card.color, display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: '20px !important' }}>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 1.5 }}>
            Payment Status Distribution
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {[
              { label: 'Unpaid', count: stats.unpaidCount, color: colors.error, bg: '#FEF2F2' },
              { label: 'Partially Paid', count: stats.partialCount, color: '#D97706', bg: '#FFFBEB' },
              { label: 'Fully Paid', count: stats.paidCount, color: colors.success, bg: '#ECFDF5' },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{ flex: 1, px: 2, py: 1.25, borderRadius: '10px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: s.color }}>{s.label}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: s.color }}>{s.count}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>All Invoices</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Issued</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">No invoices generated yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const isOverdue = inv.balanceDue > 0 && new Date(inv.dueDate) < new Date();
                return (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>{inv.patientName}</TableCell>
                    <TableCell>{formatDate(inv.date)}</TableCell>
                    <TableCell>
                      {/* Chip renders a <div>, so it must sit beside the <p>
                          Typography, not inside it (invalid DOM nesting). */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: isOverdue ? colors.error : 'inherit', fontWeight: isOverdue ? 700 : 400 }}
                        >
                          {formatDate(inv.dueDate)}
                        </Typography>
                        {isOverdue && (
                          <Chip label="Overdue" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell align="right" sx={{ color: colors.success }}>{formatCurrency(inv.paidAmount)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: inv.balanceDue > 0 ? colors.error : colors.success }}
                    >
                      {formatCurrency(inv.balanceDue)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <StatusBadge status={inv.status} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(inv.paymentPercentage ?? 0, 100)}
                          sx={{
                            flex: 1,
                            height: 5,
                            borderRadius: 999,
                            bgcolor: colors.borderLight,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: inv.balanceDue <= 0 ? colors.success : inv.paidAmount > 0 ? '#D97706' : colors.error,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                          {inv.paymentPercentage ?? 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {inv.balanceDue > 0 && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaymentIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openCollect(inv)}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Collect
                          </Button>
                        )}
                        {isDoctor && inv.status !== 'Waived' && (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openEdit(inv)}
                            sx={{ textTransform: 'none', fontWeight: 600, color: colors.textSecondary }}
                          >
                            Edit
                          </Button>
                        )}
                        {isDoctor && inv.balanceDue > 0 && inv.paidAmount === 0 && inv.status !== 'Waived' && (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<BlockIcon sx={{ fontSize: 15 }} />}
                            onClick={() => { setWaiveTarget(inv); setWaiveReason(''); }}
                            sx={{ textTransform: 'none', fontWeight: 600, color: colors.textSecondary }}
                          >
                            Waive
                          </Button>
                        )}
                        <Button
                          size="small"
                          startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
                          onClick={() => printInvoice(inv)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Print
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/patients/${inv.patientId}`, { state: { tab: 4 } })}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Ledger
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(payInvoice)} onClose={closeCollect} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Collect Payment</DialogTitle>
        <form onSubmit={submitCollect} noValidate>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>Invoice · {payInvoice?.patientName}</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{payInvoice?.invoiceNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: colors.surfaceAlt, p: 1.5, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <Typography variant="body2">Total: <strong>{formatCurrency(payInvoice?.totalAmount || 0)}</strong></Typography>
              <Typography variant="body2" color="error">Balance: <strong>{formatCurrency(payInvoice?.balanceDue || 0)}</strong></Typography>
            </Box>
            {payError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{payError}</Alert>}
            <TextField
              label="Amount (PKR)"
              type="number"
              value={payAmount}
              onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
              fullWidth
              required
              inputProps={{ min: 1, max: payInvoice?.balanceDue }}
              helperText="Enter the full balance for Fully Paid, or less for Partially Paid."
            />
            <Autocomplete
              freeSolo
              options={PAYMENT_METHODS}
              inputValue={payMethod}
              onInputChange={(e, val) => setPayMethod(val)}
              renderInput={(params) => (
                <TextField {...params} label="Payment Method" fullWidth helperText="Pick a method or type your own." />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={closeCollect} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Confirm Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Waive / write-off confirmation */}
      <Dialog open={Boolean(waiveTarget)} onClose={() => setWaiveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Waive Charge</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>Invoice · {waiveTarget?.patientName}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{waiveTarget?.invoiceNumber}</Typography>
          </Box>
          <Alert severity="info" sx={{ borderRadius: '8px', py: 0.5 }}>
            This sets the balance to <strong>{formatCurrency(0)}</strong> and marks it Waived. The patient will not be charged {formatCurrency(waiveTarget?.balanceDue || 0)}. This cannot be undone.
          </Alert>
          <TextField
            label="Reason (optional)"
            value={waiveReason}
            onChange={(e) => setWaiveReason(e.target.value)}
            fullWidth
            placeholder="e.g. Consultation waived - treatment done same visit"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setWaiveTarget(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={confirmWaive} variant="contained" color="warning" sx={{ fontWeight: 700 }}>Waive Charge</Button>
        </DialogActions>
      </Dialog>

      {/* Edit / correct invoice amounts (total and paid) */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.border}` }}>Edit Invoice Amounts</DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>Invoice · {editTarget?.patientName}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{editTarget?.invoiceNumber}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: colors.surfaceAlt, p: 1.5, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <Typography variant="body2">Current: <strong>{formatCurrency(editTarget?.totalAmount || 0)}</strong></Typography>
            <Typography variant="body2" sx={{ color: colors.success }}>Paid: <strong>{formatCurrency(editTarget?.paidAmount || 0)}</strong></Typography>
          </Box>
          {editError && <Alert severity="error" sx={{ borderRadius: '8px', py: 0.5 }}>{editError}</Alert>}
          <TextField
            label="Invoice Amount (PKR)"
            type="number"
            value={editAmount}
            onChange={(e) => { setEditAmount(e.target.value); setEditError(''); }}
            fullWidth
            required
            inputProps={{ min: 0 }}
            helperText="The total this treatment should be charged at."
          />
          <TextField
            label="Paid Amount (PKR)"
            type="number"
            value={editPaid}
            onChange={(e) => { setEditPaid(e.target.value); setEditError(''); }}
            fullWidth
            required
            inputProps={{ min: 0, max: Number(editAmount) || 0 }}
            helperText="What the patient has actually paid. The payment record is adjusted to match."
          />
          {/* The balance and status the edit will produce - derived, never typed. */}
          <Box sx={{ p: 1.5, borderRadius: '8px', border: `1px dashed ${colors.border}`, bgcolor: colors.surfaceAlt }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>After saving</Typography>
            {editPreview ? (
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.75 }}>
                <Typography variant="body2">
                  Balance:{' '}
                  <strong style={{ color: editPreview.balanceDue > 0 ? colors.error : colors.success }}>
                    {formatCurrency(editPreview.balanceDue)}
                  </strong>
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  {invoiceStatusLabel(editPreview.status)} · {editPreview.paymentPercentage}%
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.75, color: colors.textSecondary }}>
                Enter an invoice amount and a paid amount that is not more than it.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button onClick={() => setEditTarget(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained" sx={{ fontWeight: 700 }}>Save Amounts</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
