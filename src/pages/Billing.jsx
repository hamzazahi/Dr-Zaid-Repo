import { useMemo, useState } from 'react';
import {
  Alert,
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
  MenuItem,
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
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/helpers';
import { summariseInvoices } from '../utils/billing';
import { PAYMENT_METHODS } from '../utils/constants';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { Payment as PaymentIcon, ReceiptLong as ReceiptLongIcon, TrendingUp as TrendingUpIcon, HourglassEmpty as HourglassEmptyIcon } from '@mui/icons-material';

export default function Billing() {
  const { invoices, addPayment } = useClinicData();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const stats = useMemo(() => summariseInvoices(invoices), [invoices]);

  // Inline "collect payment" dialog state — lets you mark a payment as
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
    notify(`${formatCurrency(amount)} collected — invoice marked ${fullyPaid ? 'Fully Paid' : 'Partially Paid'}.`, 'success');
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
                      <Typography
                        variant="body2"
                        sx={{ color: isOverdue ? colors.error : 'inherit', fontWeight: isOverdue ? 700 : 400 }}
                      >
                        {formatDate(inv.dueDate)}
                        {isOverdue && (
                          <Chip label="Overdue" size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                      </Typography>
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
            <TextField select label="Payment Method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} fullWidth>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={closeCollect} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>Confirm Payment</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
