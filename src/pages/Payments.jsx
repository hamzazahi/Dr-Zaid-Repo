import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
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
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import { colors } from '../theme/theme';
import { Payments as PaymentsIcon } from '@mui/icons-material';

export default function Payments() {
  const { payments } = useClinicData();

  const total = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  const methodBreakdown = useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      map[p.method] = (map[p.method] || 0) + p.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Payments Ledger</Typography>
        <Typography variant="body2" color="text.secondary">
          All collected payments across all invoices.
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: '20px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: '#F0FDFA', color: '#0D9488', display: 'flex' }}>
                <PaymentsIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Collected</Typography>
                <Typography variant="h5" fontWeight={700}>{formatCurrency(total)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {methodBreakdown.map(([method, amount]) => (
                <Chip
                  key={method}
                  label={`${method}: ${formatCurrency(amount)}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>All Transactions ({payments.length})</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Invoice Ref.</TableCell>
              <TableCell>Method</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">No payments recorded yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.patientName}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: colors.textSecondary }}>{p.invoiceId}</TableCell>
                  <TableCell>
                    <Chip label={p.method} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: colors.success }}>
                    {formatCurrency(p.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
