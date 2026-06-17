import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useClinicData } from '../hooks/useClinicData';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TREATMENT_COSTS, TREATMENT_TYPES, TOOTH_NUMBERS } from '../utils/constants';
import { colors } from '../theme/theme';

const EMPTY_FORM = {
  patientId: '',
  type: 'Filling',
  toothNumber: '11',
  cost: TREATMENT_COSTS.Filling,
  notes: '',
};

export default function Treatments() {
  const { patients, treatments, addTreatment } = useClinicData();
  const { notify } = useNotification();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleChange = (field, value) => {
    setFormError('');
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { cost: TREATMENT_COSTS[value] ?? '' } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patientId) { setFormError('Please select a patient.'); return; }
    if (!form.cost || Number(form.cost) <= 0) { setFormError('Please enter a valid fee amount.'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    addTreatment(form);
    setForm(EMPTY_FORM);
    notify(`Treatment logged for ${patient?.name}. Invoice generated automatically.`, 'success');
  };

  const totalRevenue = useMemo(
    () => treatments.reduce((sum, t) => sum + t.cost, 0),
    [treatments]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>Treatment Cases</Typography>
        <Typography variant="body2" color="text.secondary">
          Record procedures — invoices are generated automatically.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Log New Treatment</Typography>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {formError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Patient *"
                  value={form.patientId}
                  onChange={(e) => handleChange('patientId', e.target.value)}
                  fullWidth
                  required
                  error={Boolean(formError && !form.patientId)}
                >
                  {patients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Procedure"
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  fullWidth
                >
                  {TREATMENT_TYPES.filter((t) => t !== 'Consultation').map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Tooth #"
                  value={form.toothNumber}
                  onChange={(e) => handleChange('toothNumber', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="All">All Teeth</MenuItem>
                  {TOOTH_NUMBERS.map((n) => (
                    <MenuItem key={n} value={n}>Tooth #{n}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Fee (PKR)"
                  type="number"
                  value={form.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<LocalHospitalIcon />}
                  fullWidth
                  sx={{
                    bgcolor: '#0D9488',
                    '&:hover': { bgcolor: '#0B7A6F' },
                    height: 40,
                  }}
                >
                  Log Treatment
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Clinical Notes"
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Describe procedure details, findings, or follow-up instructions…"
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
          <Typography variant="subtitle2" fontWeight={700}>Treatment History ({treatments.length})</Typography>
          <Chip label={`Total: ${formatCurrency(totalRevenue)}`} color="success" size="small" sx={{ fontWeight: 700 }} />
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Dentist</TableCell>
              <TableCell>Procedure</TableCell>
              <TableCell>Tooth</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {treatments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">No treatments logged yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              treatments.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.primary }}>{t.patientName}</TableCell>
                  <TableCell>{t.dentistName || '—'}</TableCell>
                  <TableCell>
                    <Chip label={t.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {t.toothNumber === 'All' ? 'All Teeth' : `#${t.toothNumber}`}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 380, fontSize: '0.8rem' }}>
                    {t.notes || '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(t.cost)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
