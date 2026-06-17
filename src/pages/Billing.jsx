import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNavigate } from 'react-router-dom';
import { useClinicData } from '../hooks/useClinicData';
import { formatCurrency, formatDate } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

export default function Billing() {
  const { invoices } = useClinicData();
  const navigate = useNavigate();
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Billing</Typography>
          <Typography variant="body2" color="text.secondary">Track invoices, due balances, and patient collections.</Typography>
        </Box>
        <Chip label={`Outstanding ${formatCurrency(outstanding)}`} color={outstanding > 0 ? 'error' : 'success'} sx={{ fontWeight: 'bold' }} />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Issued</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Due</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Balance</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.patientName}</TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: invoice.balanceDue > 0 ? '#EF4444' : '#10B981' }}>{formatCurrency(invoice.balanceDue)}</TableCell>
                <TableCell><StatusBadge status={invoice.status} /></TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<PaymentIcon />} onClick={() => navigate(`/patients/${invoice.patientId}`)} sx={{ textTransform: 'none' }}>
                    Open Ledger
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
