import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Payments() {
  const { payments } = useClinicData();
  const collected = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold">Payments</Typography>
        <Typography variant="body2" color="text.secondary">Collected total: {formatCurrency(collected)}</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>{formatDate(payment.date)}</TableCell>
                <TableCell>{payment.patientName}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{payment.invoiceId}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
