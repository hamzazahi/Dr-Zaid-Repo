import { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { summariseInvoices } from '../utils/billing';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';
import { Payment as PaymentIcon, ReceiptLong as ReceiptLongIcon, TrendingUp as TrendingUpIcon, HourglassEmpty as HourglassEmptyIcon } from '@mui/icons-material';

export default function Billing() {
  const { invoices } = useClinicData();
  const navigate = useNavigate();

  const stats = useMemo(() => summariseInvoices(invoices), [invoices]);

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
                      <Button
                        size="small"
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate(`/patients/${inv.patientId}`, { state: { tab: 3 } })}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Ledger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
