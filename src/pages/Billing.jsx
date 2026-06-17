import { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
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
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import { colors } from '../theme/theme';

export default function Billing() {
  const { invoices } = useClinicData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
    const paidCount = invoices.filter((i) => i.status === 'Paid').length;
    return { total, collected, outstanding, paidCount };
  }, [invoices]);

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
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
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
